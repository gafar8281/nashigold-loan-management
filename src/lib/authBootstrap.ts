import { findUserByEmail, userService } from '@/services/userService'

const ADMIN_UID = 'USER-ADMIN'
const ADMIN_EMAIL = 'admin@nashigold.com'
const ADMIN_PASSWORD = 'admin@123'

/**
 * Ensure the default Super Admin account exists in the Firestore `users`
 * collection. Runs once at startup.
 *
 * If no admin user exists (or one exists without a password, e.g. a record left
 * over from the old Firebase Auth setup), (re)write the admin profile with its
 * credentials. Idempotent: the doc id is fixed (`USER-ADMIN`). Any failure is
 * re-thrown so callers can log it; the app still loads.
 */
export async function bootstrapAdmin(): Promise<void> {
  const existing = await findUserByEmail(ADMIN_EMAIL)
  if (existing && existing.password) return

  await userService.setDoc(ADMIN_UID, {
    id: ADMIN_UID,
    uid: ADMIN_UID,
    username: 'admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    branchId: null,
    branchName: 'H0',
    isActive: true,
  })
}
