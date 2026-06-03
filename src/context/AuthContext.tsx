/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react'
import type { AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => boolean
  signup: (email: string, branch: string, password: string) => void
  logout: () => void
  updateUser: (updates: { email?: string; branch?: string }) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'gold_loan_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  function login(email: string, password: string): boolean {
    void password
    if (!email) return false
    const newUser: AuthUser = { email, branch: 'Riyadh Main Branch' }
    setUser(newUser)
    return true
  }

  function signup(email: string, branch: string, password: string): void {
    void password
    const newUser: AuthUser = { email, branch: branch || 'Default Branch' }
    setUser(newUser)
  }

  function logout(): void {
    setUser(null)
  }

  function updateUser(updates: { email?: string; branch?: string }): void {
    setUser(prev => prev ? { ...prev, ...updates } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
