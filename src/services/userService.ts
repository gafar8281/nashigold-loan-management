import type { AppUser } from '@/types'
import { createCollectionService } from './firestore'

/**
 * Firestore `users` collection, keyed by Firebase Auth uid. The generic service
 * expects an `id` field, so we use `AppUser['uid']` as the document id and let
 * the service treat the doc id as the source of truth.
 */
type UserDoc = AppUser & { id: string }

export const userService = createCollectionService<UserDoc>('users')
