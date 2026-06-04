import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  query,
  limit,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * Generic, reusable Firestore collection service.
 *
 * Each document's `id` is the Firestore document id (e.g. `CUST-0001`), so it is
 * stripped from the stored fields and re-attached on read. This keeps the rest of
 * the app working with the same human-readable ids it uses in routes and the UI.
 *
 * @template T A document shape that carries a string `id`.
 */
export interface CollectionService<T extends { id: string }> {
  /** Subscribe to real-time updates. Returns an unsubscribe function. */
  subscribe: (onData: (items: T[]) => void, onError: (error: Error) => void) => Unsubscribe
  /** Fetch all documents once. */
  getAll: () => Promise<T[]>
  /** Create or overwrite a document with an explicit id. */
  setDoc: (id: string, data: T) => Promise<void>
  /** Partially update an existing document. */
  update: (id: string, partial: Partial<T>) => Promise<void>
  /** Whether the collection has at least one document (used for seeding). */
  exists: () => Promise<boolean>
}

export function createCollectionService<T extends { id: string }>(
  collectionName: string,
): CollectionService<T> {
  const colRef = collection(db, collectionName)

  /** Map a Firestore document into our app shape: doc id wins over any stored id. */
  function toItem(id: string, data: Record<string, unknown>): T {
    return { ...(data as Omit<T, 'id'>), id } as T
  }

  return {
    subscribe(onData, onError) {
      return onSnapshot(
        colRef,
        snapshot => {
          const items = snapshot.docs.map(d => toItem(d.id, d.data()))
          onData(items)
        },
        error => onError(error as Error),
      )
    },

    async getAll() {
      const snapshot = await getDocs(colRef)
      return snapshot.docs.map(d => toItem(d.id, d.data()))
    },

    async setDoc(id, data) {
      // Persist without the redundant `id` field — it lives as the document id.
      const { id: _omit, ...fields } = data
      void _omit
      await setDoc(doc(db, collectionName, id), fields)
    },

    async update(id, partial) {
      const { id: _omit, ...fields } = partial as Partial<T> & { id?: string }
      void _omit
      await updateDoc(doc(db, collectionName, id), fields as Record<string, unknown>)
    },

    async exists() {
      const snapshot = await getDocs(query(colRef, limit(1)))
      return !snapshot.empty
    },
  }
}
