import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Branch } from '@/types'
import { branchService } from './branchService'
import { findUserByEmail, userService } from './userService'

function nowISO(): string {
  return new Date().toISOString()
}

/** Resolve the user doc id (== uid) for a given branchId. */
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
 * Provision a new branch: write its `branches` document and a matching `users`
 * document holding the login credentials. The email must be unique across all
 * users.
 */
export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const { branchName, branchEmail, password } = input

  if (await findUserByEmail(branchEmail)) {
    throw new Error('That email is already in use by another account.')
  }

  const branchId = `branch_${Date.now().toString(36)}`
  const uid = `user_${Date.now().toString(36)}`

  const branch: Branch = {
    id: branchId,
    branchName,
    branchEmail,
    isActive: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }

  await branchService.setDoc(branchId, branch)
  await userService.setDoc(uid, {
    id: uid,
    uid,
    username: branchName,
    email: branchEmail,
    password,
    role: 'branch',
    branchId,
    branchName,
    isActive: true,
  })

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

/** Enable/disable a branch (disabling blocks the branch from logging in). */
export function setBranchActive(branchId: string, isActive: boolean): Promise<void> {
  return updateBranch(branchId, { isActive })
}

/**
 * Delete a branch: removes both the `branches` and `users` documents. With
 * Firestore-only auth there is no separate auth account, so this fully and
 * permanently removes the branch login.
 */
export async function deleteBranch(branchId: string): Promise<void> {
  const uid = await findUserIdByBranch(branchId)
  await deleteDoc(doc(db, 'branches', branchId))
  if (uid) await deleteDoc(doc(db, 'users', uid))
}
