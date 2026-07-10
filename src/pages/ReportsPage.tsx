import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { useBranches } from '@/hooks/useBranches'
import InitialBalanceLedger from '@/components/reports/InitialBalanceLedger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import TablePagination from '@/components/shared/TablePagination'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { calcDaysOverdue, calcEffectiveLateFee } from '@/lib/calculations'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 50

export default function ReportsPage() {
  const { loans, getCustomerById } = useData()
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { branches, loading: branchesLoading } = useBranches()
  const [activeTab, setActiveTab] = useState('active')
  const [activePage, setActivePage] = useState(1)
  const [overduePage, setOverduePage] = useState(1)
  const [closedPage, setClosedPage] = useState(1)

  const tabs = [
    { id: 'active', label: t('reports.activeLoans') },
    { id: 'overdue', label: t('reports.overdueLoans') },
    { id: 'closed', label: t('reports.closedLoans') },
    { id: 'summary', label: t('reports.branchSummary') },
    ...(isAdmin ? [{ id: 'ledger', label: t('reports.initialBalance') }] : []),
  ]

  const activeLoans = loans.filter(l => l.status === 'Active')
  const overdueLoans = loans.filter(l => l.status === 'Overdue')
  const closedLoans = loans.filter(l => l.status === 'Closed')

  const paginatedActive = activeLoans.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const paginatedOverdue = overdueLoans.slice((overduePage - 1) * PAGE_SIZE, overduePage * PAGE_SIZE)
  const paginatedClosed = closedLoans.slice((closedPage - 1) * PAGE_SIZE, closedPage * PAGE_SIZE)

  const totalDisbursed = loans.reduce((s, l) => s + l.loanAmount, 0)
  const totalCollected = loans.reduce((s, l) => s + l.amountPaid, 0)
  const totalOutstanding = loans
    .filter(l => l.status !== 'Closed')
    .reduce((s, l) => s + l.remainingBalance, 0)
  const totalOverdueAmount = overdueLoans.reduce((s, l) => s + l.remainingBalance, 0)

  const sortedBranches = useMemo(
    () => [...branches].sort((a, b) => a.branchName.localeCompare(b.branchName)),
    [branches]
  )

  const branchProfits = useMemo(
    () => sortedBranches.map(branch => {
      const branchLoans = loans.filter(l => l.branchId === branch.id)
      const profit = branchLoans.reduce(
        (s, l) => s + l.interestAmount + calcEffectiveLateFee(l.lateFeePerMonth, l.periodTo, l.status),
        0
      )
      return { id: branch.id, name: branch.branchName, profit, loanCount: branchLoans.length }
    }),
    [sortedBranches, loans]
  )

  const unassignedLoans = loans.filter(l => !l.branchId || !branches.some(b => b.id === l.branchId))
  const unassignedProfit = unassignedLoans.reduce(
    (s, l) => s + l.interestAmount + calcEffectiveLateFee(l.lateFeePerMonth, l.periodTo, l.status),
    0
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('reports.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('reports.subtitle')}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setActivePage(1); setOverduePage(1); setClosedPage(1) }}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Active Loans */}
      {activeTab === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.activeLoans')} ({activeLoans.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.loanId')}</TableHead>
                  <TableHead>{t('table.customer')}</TableHead>
                  <TableHead>{t('table.loanAmount')}</TableHead>
                  <TableHead>{t('table.period')}</TableHead>
                  <TableHead>{t('table.remainingBalance')}</TableHead>
                  <TableHead>{t('table.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActive.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('reports.noActiveLoans')}</TableCell></TableRow>
                ) : (
                  paginatedActive.map(loan => {
                    const customer = getCustomerById(loan.customerId)
                    return (
                      <TableRow key={loan.id}>
                        <TableCell><Link to={`/loans/${loan.id}`} className="text-amber-600 hover:underline font-medium">{loan.id}</Link></TableCell>
                        <TableCell><Link to={`/customers/${loan.customerId}`} className="hover:underline">{customer?.fullName ?? '—'}</Link></TableCell>
                        <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}</TableCell>
                        <TableCell>{formatCurrency(loan.remainingBalance)}</TableCell>
                        <TableCell><StatusBadge status={loan.status} /></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={activePage}
              totalPages={Math.ceil(activeLoans.length / PAGE_SIZE)}
              totalItems={activeLoans.length}
              pageSize={PAGE_SIZE}
              onPrev={() => setActivePage(p => p - 1)}
              onNext={() => setActivePage(p => p + 1)}
            />
          </CardContent>
        </Card>
      )}

      {/* Tab: Overdue Loans */}
      {activeTab === 'overdue' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.overdueLoans')} ({overdueLoans.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.loanId')}</TableHead>
                  <TableHead>{t('table.customer')}</TableHead>
                  <TableHead>{t('table.loanAmount')}</TableHead>
                  <TableHead>{t('table.dueDate')}</TableHead>
                  <TableHead>{t('table.daysOverdue')}</TableHead>
                  <TableHead>{t('table.remainingBalance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOverdue.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('reports.noOverdueLoans')}</TableCell></TableRow>
                ) : (
                  paginatedOverdue.map(loan => {
                    const customer = getCustomerById(loan.customerId)
                    const days = calcDaysOverdue(loan.periodTo)
                    return (
                      <TableRow key={loan.id}>
                        <TableCell><Link to={`/loans/${loan.id}`} className="text-amber-600 hover:underline font-medium">{loan.id}</Link></TableCell>
                        <TableCell><Link to={`/customers/${loan.customerId}`} className="hover:underline">{customer?.fullName ?? '—'}</Link></TableCell>
                        <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(loan.periodTo)}</TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{days} {days !== 1 ? t('common.days') : t('common.day')}</span>
                        </TableCell>
                        <TableCell>{formatCurrency(loan.remainingBalance)}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={overduePage}
              totalPages={Math.ceil(overdueLoans.length / PAGE_SIZE)}
              totalItems={overdueLoans.length}
              pageSize={PAGE_SIZE}
              onPrev={() => setOverduePage(p => p - 1)}
              onNext={() => setOverduePage(p => p + 1)}
            />
          </CardContent>
        </Card>
      )}

      {/* Tab: Closed Loans */}
      {activeTab === 'closed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('reports.closedLoans')} ({closedLoans.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.loanId')}</TableHead>
                  <TableHead>{t('table.customer')}</TableHead>
                  <TableHead>{t('table.loanAmount')}</TableHead>
                  <TableHead>{t('table.totalRepaid')}</TableHead>
                  <TableHead>{t('table.period')}</TableHead>
                  <TableHead>{t('table.created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClosed.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('reports.noClosedLoans')}</TableCell></TableRow>
                ) : (
                  paginatedClosed.map(loan => {
                    const customer = getCustomerById(loan.customerId)
                    return (
                      <TableRow key={loan.id}>
                        <TableCell><Link to={`/loans/${loan.id}`} className="text-amber-600 hover:underline font-medium">{loan.id}</Link></TableCell>
                        <TableCell><Link to={`/customers/${loan.customerId}`} className="hover:underline">{customer?.fullName ?? '—'}</Link></TableCell>
                        <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell className="text-green-700 font-medium">{formatCurrency(loan.amountPaid)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(loan.createdAt)}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={closedPage}
              totalPages={Math.ceil(closedLoans.length / PAGE_SIZE)}
              totalItems={closedLoans.length}
              pageSize={PAGE_SIZE}
              onPrev={() => setClosedPage(p => p - 1)}
              onNext={() => setClosedPage(p => p + 1)}
            />
          </CardContent>
        </Card>
      )}

      {/* Tab: Initial Balance Ledger (admin only) */}
      {activeTab === 'ledger' && isAdmin && <InitialBalanceLedger />}

      {/* Tab: Branch Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">{t('reports.totalDisbursed')}</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{formatCurrency(totalDisbursed)}</p><p className="text-xs text-muted-foreground mt-0.5">{t('reports.loansTotal', { count: loans.length })}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">{t('reports.totalCollected')}</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-green-700">{formatCurrency(totalCollected)}</p><p className="text-xs text-muted-foreground mt-0.5">{t('reports.loansClosed', { count: closedLoans.length })}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">{t('reports.outstandingBalance')}</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p><p className="text-xs text-muted-foreground mt-0.5">{t('reports.openLoans', { count: loans.filter(l => l.status !== 'Closed').length })}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">{t('reports.overdueAmount')}</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdueAmount)}</p><p className="text-xs text-muted-foreground mt-0.5">{t('reports.overdueLoansCount', { count: overdueLoans.length })}</p></CardContent>
            </Card>
          </div>

          {isAdmin && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t('reports.profitByBranch')}</CardTitle></CardHeader>
              <CardContent>
                {!branchesLoading && branchProfits.length === 0 && unassignedLoans.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">{t('reports.noBranches')}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {branchProfits.map(bp => (
                      <div key={bp.id} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground font-medium truncate">{bp.name}</p>
                        <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(bp.profit)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('reports.loansTotal', { count: bp.loanCount })}</p>
                      </div>
                    ))}
                    {unassignedLoans.length > 0 && (
                      <div className="rounded-lg border border-dashed p-3">
                        <p className="text-xs text-muted-foreground font-medium truncate">{t('reports.unassignedBranch')}</p>
                        <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(unassignedProfit)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('reports.loansTotal', { count: unassignedLoans.length })}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">{t('reports.statusBreakdown')}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(['Active', 'Overdue', 'Approved', 'Closed'] as const).map(status => {
                  const count = loans.filter(l => l.status === status).length
                  const pct = loans.length ? Math.round((count / loans.length) * 100) : 0
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <StatusBadge status={status} />
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-muted-foreground w-16 text-end">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
