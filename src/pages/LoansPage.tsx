import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import TablePagination from '@/components/shared/TablePagination'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { LoanStatus } from '@/types'

const PAGE_SIZE = 50

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Loans' },
  { value: 'Active', label: 'Active' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Closed', label: 'Closed' },
]

export default function LoansPage() {
  const { loans, getCustomerById } = useData()
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = statusFilter === 'all'
    ? loans
    : loans.filter(l => l.status === statusFilter)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Loans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{loans.length} total loans</p>
        </div>
        <Button asChild>
          <Link to="/loans/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Loan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(opt => (
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
                  <span className="ml-1.5 opacity-70">
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
                <TableHead>Loan ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Gold (g)</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No loans found
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
