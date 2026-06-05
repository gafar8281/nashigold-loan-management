import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { secondaryAuth } from '@/lib/firebase'
import { userService } from '@/services/userService'

const ADMIN_EMAIL = 'admin@nashigold.com'
const ADMIN_PASSWORD = 'admin@123'

/**
 * Ensure the default Super Admin account exists. Runs once at startup on
 * `secondaryAuth` so it never disturbs the primary (logged-in) session.
 *
 * Strategy: try to sign in as admin; if the account doesn't exist yet, create
 * it. Either way, (re)write the `users/{uid}` admin profile so the role is
 * present, then sign the secondary session out. Any failure (e.g. the
 * Email/Password provider not being enabled) is logged and swallowed so the app
 * still loads.
 */
export async function bootstrapAdmin(): Promise<void> {
  try {
    let uid: string
    try {
      const cred = await signInWithEmailAndPassword(
        secondaryAuth,
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
      )
      uid = cred.user.uid
    } catch (err) {
      const code = (err as { code?: string }).code
      // `invalid-credential` is returned for unknown emails when email
      // enumeration protection is enabled.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          ADMIN_EMAIL,
          ADMIN_PASSWORD,
        )
        uid = cred.user.uid
      } else {
        throw err
      }
    }

    await userService.setDoc(uid, {
      id: uid,
      uid,
      username: 'admin',
      email: ADMIN_EMAIL,
      role: 'admin',
      branchId: null,
      branchName: 'H0',
      isActive: true,
    })
    await signOut(secondaryAuth)
  } catch (err) {
    // Re-throw so callers can surface the error in the UI.
    throw err
  }
}
