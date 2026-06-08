import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablePaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
}

export default function TablePagination({ page, totalPages, totalItems, pageSize, onPrev, onNext }: TablePaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
      <span>{t('common.showingEntries', { from, to, total: totalItems })}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
          {t('common.previous')}
        </Button>
        <span className="text-xs px-2">{t('common.pageOf', { page, total: totalPages })}</span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={page === totalPages}>
          {t('common.next')}
          <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}
