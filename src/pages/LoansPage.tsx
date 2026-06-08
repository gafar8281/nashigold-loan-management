import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import TablePagination from '@/components/shared/TablePagination'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { LoanStatus } from '@/types'

const PAGE_SIZE = 50

export default function LoansPage() {
  const { loans, getCustomerById } = useData()
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const statusOptions = [
    { value: 'all', label: t('loans.allLoans') },
    { value: 'Active', label: t('status.Active') },
    { value: 'Overdue', label: t('status.Overdue') },
    { value: 'Approved', label: t('status.Approved') },
    { value: 'Closed', label: t('status.Closed') },
  ]

  const filtered = statusFilter === 'all'
    ? loans
    : loans.filter(l => l.status === statusFilter)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('loans.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('loans.subtitle', { count: loans.length })}</p>
        </div>
        <Button asChild>
          <Link to="/loans/new">
            <Plus className="h-4 w-4 me-1.5" />
            {t('loans.newLoan')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(1) }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-border text-muted-foreground hover:border-amber-300'
                }`}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span className="ms-1.5 opacity-70">
                    {loans.filter(l => l.status === opt.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.loanId')}</TableHead>
                <TableHead>{t('table.customer')}</TableHead>
                <TableHead>{t('table.loanAmount')}</TableHead>
                <TableHead>{t('table.goldGrams')}</TableHead>
                <TableHead>{t('table.period')}</TableHead>
                <TableHead>{t('table.remaining')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('loans.noFound')}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map(loan => {
                  const customer = getCustomerById(loan.customerId)
                  return (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <Link to={`/loans/${loan.id}`} className="font-medium text-amber-600 hover:underline">
                          {loan.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/customers/${loan.customerId}`} className="hover:underline">
                          {customer?.fullName ?? '—'}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                      <TableCell className="text-muted-foreground">{loan.goldWeight}g</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}
                      </TableCell>
                      <TableCell>{formatCurrency(loan.remainingBalance)}</TableCell>
                      <TableCell><StatusBadge status={loan.status as LoanStatus} /></TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage(p => p - 1)}
            onNext={() => setPage(p => p + 1)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
