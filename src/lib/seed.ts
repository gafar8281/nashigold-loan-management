import { doc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { initialCustomers } from '@/data/customers'
import { initialLoans } from '@/data/loans'
import { customerService } from '@/services/customerService'
import { loanService } from '@/services/loanService'

/**
 * One-time seed of the demo data. For each collection, if it is empty we write the
 * static `initialCustomers` / `initialLoans` so a fresh Firestore project isn't blank.
 * Re-running is a no-op once the collections contain documents.
 */
export async function seedIfEmpty(): Promise<void> {
  const [hasCustomers, hasLoans] = await Promise.all([
    customerService.exists(),
    loanService.exists(),
  ])

  if (!hasCustomers) {
    const batch = writeBatch(db)
    for (const customer of initialCustomers) {
      const { id, ...fields } = customer
      batch.set(doc(db, 'customers', id), fields)
    }
    await batch.commit()
  }

  if (!hasLoans) {
    const batch = writeBatch(db)
    for (const loan of initialLoans) {
      const { id, ...fields } = loan
      batch.set(doc(db, 'loans', id), fields)
    }
    await batch.commit()
  }
}
