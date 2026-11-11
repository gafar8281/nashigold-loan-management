import { signInAnonymously, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

let pending: Promise<User> | null = null

/**
 * Ensure a Firebase anonymous session exists before any Firestore access, so
 * security rules can require `request.auth != null`.
 *
 * Reuses the persisted anonymous user (IndexedDB) when there is one, so a
 * refresh keeps the same uid. Memoized; the cached promise is cleared on
 * failure so a later call can retry.
 */
export function ensureAnonymousAuth(): Promise<User> {
  if (!pending) {
    pending = (async () => {
      await auth.authStateReady()
      if (auth.currentUser) return auth.currentUser
      const { user } = await signInAnonymously(auth)
      return user
    })().catch(err => {
      pending = null
      throw err
    })
  }
  return pending
}
