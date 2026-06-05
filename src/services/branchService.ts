import type { Branch } from '@/types'
import { createCollectionService } from './firestore'

export const branchService = createCollectionService<Branch>('branches')
