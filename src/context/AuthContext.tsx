/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { bootstrapAdmin } from '@/lib/authBootstrap'
import type { AppUser } from '@/types'

interface AuthContextValue {
  user: AppUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  /** True until both bootstrap and the first auth state check complete. */
  initializing: boolean
  /** Returns an error message on failure, or null on success. */
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Read the Firestore `users/{uid}` profile, or null if it doesn't exist. */
async function fetchProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { ...(snap.data() as Omit<AppUser, 'uid'>), uid }
}

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string }).code
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return 'Sign in failed. Please try again.'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [authReady, setAuthReady] = useState(false)

  // `initializing` only tracks whether Firebase has fired the first auth-state
  // event. It is used by ProtectedRoute to avoid flashing /login on refresh.
  // Bootstrap runs independently in the background.
  const initializing = !authReady

  // Bootstrap the Super Admin account silently in the background.
  useEffect(() => {
    bootstrapAdmin().catch(err => console.error('[AuthProvider] bootstrap failed:', err))
  }, [])

  // Restore the session on refresh and keep `user` in sync with Firebase Auth.
  useEffect(() => {
    return onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        setUser(null)
        setAuthReady(true)
        return
      }
      const profile = await fetchProfile(firebaseUser.uid)
      if (!profile || !profile.isActive) {
        await signOut(auth)
        setUser(null)
      } else {
        setUser(profile)
      }
      setAuthReady(true)
    })
  }, [])

  async function login(email: string, password: string): Promise<string | null> {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const profile = await fetchProfile(cred.user.uid)
      if (!profile) {
        await signOut(auth)
        return 'No profile found for this account. Contact your administrator.'
      }
      if (!profile.isActive) {
        await signOut(auth)
        return 'This account has been disabled.'
      }
      setUser(profile)
      return null
    } catch (err) {
      return mapAuthError(err)
    }
  }

  async function logout(): Promise<void> {
    await signOut(auth)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        initializing,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
