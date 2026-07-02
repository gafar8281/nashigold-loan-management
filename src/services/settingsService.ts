import type { LedgerSettings } from '@/types'
import { createCollectionService } from './firestore'

export const settingsService = createCollectionService<LedgerSettings>('settings')
