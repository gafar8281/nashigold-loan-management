import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { AppUser } from '@/types'
import { createCollectionService } from './firestore'

/**
 * Firestore `users` collection document. Mirrors `AppUser` plus the credential
 * fields needed for Firestore-only authentication: `id` (== the document id,
 * which equals `uid`) and the user's `password`. The password is intentionally
 * stripped before a user is exposed to the rest of the app (see AuthContext).
 */
export type UserDoc = AppUser & { id: string; password: string }

export const userService = createCollectionService<UserDoc>('users')

/**
 * Look up a single user by email. This is the one place credentials are
 * resolved — reused by login and by branch-creation uniqueness checks.
 * Returns the full document (including `password`) or null if none matches.
 */
export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('email', '==', email), limit(1)),
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  return { ...(d.data() as Omit<UserDoc, 'id'>), id: d.id }
}
