import { Badge } from '@/components/ui/badge'
import type { LoanStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusStyles: Record<LoanStatus, string> = {
  'Active': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300',
  'Overdue': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300',
  'Closed': 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  'Approved': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
}

interface StatusBadgeProps {
  status: LoanStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', statusStyles[status])}
    >
      {status}
    </Badge>
  )
}
