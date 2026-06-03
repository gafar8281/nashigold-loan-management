import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { calcDaysOverdue } from '@/lib/calculations'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'active', label: 'Active Loans' },
  { id: 'overdue', label: 'Overdue Loans' },
  { id: 'closed', label: 'Closed Loans' },
  { id: 'transactions', label: 'Customer Transactions' },
  { id: 'summary', label: 'Branch Summary' },
]

export default function ReportsPage() {
  const { loans, customers, getCustomerById } = useData()
  const [activeTab, setActiveTab] = useState('active')

  const activeLoans = loans.filter(l => l.status === 'Active')
  const overdueLoans = loans.filter(l => l.status === 'Overdue')
  const closedLoans = loans.filter(l => l.status === 'Closed')

  const totalDisbursed = loans.reduce((s, l) => s + l.loanAmount, 0)
  const totalCollected = loans.reduce((s, l) => s + l.amountPaid, 0)
  const totalOutstanding = loans
    .filter(l => l.status !== 'Closed')
    .reduce((s, l) => s + l.remainingBalance, 0)
  const totalOverdueAmount = overdueLoans.reduce((s, l) => s + l.remainingBalance, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Branch loan reports and analytics</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
            <CardTitle className="text-base">Active Loans ({activeLoans.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Period</TableHead> 
                  <TableHead>Remaining Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeLoans.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No active loans</TableCell></TableRow>
                ) : (
                  activeLoans.map(loan => {
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
          </CardContent>
        </Card>
      )}

      {/* Tab: Overdue Loans */}
      {activeTab === 'overdue' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdue Loans ({overdueLoans.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Remaining Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueLoans.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No overdue loans</TableCell></TableRow>
                ) : (
                  overdueLoans.map(loan => {
                    const customer = getCustomerById(loan.customerId)
                    const days = calcDaysOverdue(loan.periodTo)
                    return (
                      <TableRow key={loan.id}>
                        <TableCell><Link to={`/loans/${loan.id}`} className="text-amber-600 hover:underline font-medium">{loan.id}</Link></TableCell>
                        <TableCell><Link to={`/customers/${loan.customerId}`} className="hover:underline">{customer?.fullName ?? '—'}</Link></TableCell>
                        <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(loan.periodTo)}</TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{days} day{days !== 1 ? 's' : ''}</span>
                        </TableCell>
                        <TableCell>{formatCurrency(loan.remainingBalance)}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab: Closed Loans */}
      {activeTab === 'closed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Closed Loans ({closedLoans.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Total Repaid</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedLoans.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No closed loans</TableCell></TableRow>
                ) : (
                  closedLoans.map(loan => {
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
          </CardContent>
        </Card>
      )}

      {/* Tab: Customer Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {customers.map(customer => {
            const customerLoans = loans.filter(l => l.customerId === customer.id)
            if (customerLoans.length === 0) return null
            return (
              <Card key={customer.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      <Link to={`/customers/${customer.id}`} className="text-amber-600 hover:underline">
                        {customer.fullName}
                      </Link>
                      <span className="text-muted-foreground font-normal ml-2">{customer.id}</span>
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">{customerLoans.length} loan{customerLoans.length !== 1 ? 's' : ''}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerLoans.map(loan => (
                        <TableRow key={loan.id}>
                          <TableCell><Link to={`/loans/${loan.id}`} className="text-amber-600 hover:underline font-medium">{loan.id}</Link></TableCell>
                          <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                          <TableCell className="text-green-700">{formatCurrency(loan.amountPaid)}</TableCell>
                          <TableCell>{formatCurrency(loan.remainingBalance)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}</TableCell>
                          <TableCell><StatusBadge status={loan.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Tab: Branch Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">Total Disbursed</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{formatCurrency(totalDisbursed)}</p><p className="text-xs text-muted-foreground mt-0.5">{loans.length} loans total</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">Total Collected</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-green-700">{formatCurrency(totalCollected)}</p><p className="text-xs text-muted-foreground mt-0.5">{closedLoans.length} loans closed</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">Outstanding Balance</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p><p className="text-xs text-muted-foreground mt-0.5">{loans.filter(l => l.status !== 'Closed').length} open loans</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">Overdue Amount</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdueAmount)}</p><p className="text-xs text-muted-foreground mt-0.5">{overdueLoans.length} overdue loans</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground font-medium">Profit Amount</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-green-600">{formatCurrency(27000)}</p><p className="text-xs text-muted-foreground mt-0.5">Total profit amount</p></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Loan Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {(['Active', 'Overdue', 'Approved', 'Pending Approval', 'Closed'] as const).map(status => {
                  const count = loans.filter(l => l.status === status).length
                  const pct = loans.length ? Math.round((count / loans.length) * 100) : 0
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <StatusBadge status={status} />
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
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
