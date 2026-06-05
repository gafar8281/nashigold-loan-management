import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { auth, db, secondaryAuth } from '@/lib/firebase'
import type { Branch } from '@/types'
import { branchService } from './branchService'
import { userService } from './userService'

function nowISO(): string {
  return new Date().toISOString()
}

/** Resolve the Firebase Auth uid (== users doc id) for a given branchId. */
async function findUserIdByBranch(branchId: string): Promise<string | null> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('branchId', '==', branchId)),
  )
  return snap.empty ? null : snap.docs[0].id
}

export interface CreateBranchInput {
  branchName: string
  branchEmail: string
  password: string
}

/**
 * Provision a new branch: create its login on `secondaryAuth` (so the admin's
 * own session is untouched), then write the matching `branches` and `users`
 * documents. The secondary session is signed out afterwards.
 */
export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const { branchName, branchEmail, password } = input
  const branchId = `branch_${Date.now().toString(36)}`

  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    branchEmail,
    password,
  )
  const uid = cred.user.uid

  const branch: Branch = {
    id: branchId,
    branchName,
    branchEmail,
    isActive: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }

  try {
    await branchService.setDoc(branchId, branch)
    await userService.setDoc(uid, {
      id: uid,
      uid,
      username: branchName,
      email: branchEmail,
      role: 'branch',
      branchId,
      branchName,
      isActive: true,
    })
  } finally {
    await signOut(secondaryAuth)
  }

  return branch
}

export interface UpdateBranchInput {
  branchName?: string
  branchEmail?: string
  isActive?: boolean
}

/** Update a branch and mirror the relevant fields onto its linked user doc. */
export async function updateBranch(
  branchId: string,
  updates: UpdateBranchInput,
): Promise<void> {
  await branchService.update(branchId, { ...updates, updatedAt: nowISO() })

  const uid = await findUserIdByBranch(branchId)
  if (uid) {
    const userUpdates: Record<string, unknown> = {}
    if (updates.branchName !== undefined) {
      userUpdates.branchName = updates.branchName
      userUpdates.username = updates.branchName
    }
    if (updates.branchEmail !== undefined) userUpdates.email = updates.branchEmail
    if (updates.isActive !== undefined) userUpdates.isActive = updates.isActive
    if (Object.keys(userUpdates).length > 0) {
      await userService.update(uid, userUpdates)
    }
  }
}

/** Enable/disable a branch (temporary disable blocks the branch from logging in). */
export function setBranchActive(branchId: string, isActive: boolean): Promise<void> {
  return updateBranch(branchId, { isActive })
}

/** Send a password-reset email for the branch login. */
export function resetBranchPassword(branchEmail: string): Promise<void> {
  return sendPasswordResetEmail(auth, branchEmail)
}

/**
 * Delete a branch: removes the `branches` and `users` documents. NOTE: the
 * underlying Firebase Auth account cannot be deleted from the client (that
 * needs the Admin SDK). Because login requires a matching `users` doc, removing
 * it makes the account unusable — so this is effectively a permanent disable.
 */
export async function deleteBranch(branchId: string): Promise<void> {
  const uid = await findUserIdByBranch(branchId)
  await deleteDoc(doc(db, 'branches', branchId))
  if (uid) await deleteDoc(doc(db, 'users', uid))
}
