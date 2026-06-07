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
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
      <span>Showing {from}–{to} of {totalItems} entries</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-xs px-2">Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={page === totalPages}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
