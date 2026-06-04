import type { Customer } from '@/types'
import { createCollectionService } from './firestore'

export const customerService = createCollectionService<Customer>('customers')
