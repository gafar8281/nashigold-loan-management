import type { Loan } from '@/types'
import { createCollectionService } from './firestore'

export const loanService = createCollectionService<Loan>('loans')
