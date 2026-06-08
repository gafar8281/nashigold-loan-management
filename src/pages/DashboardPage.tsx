import { Link } from 'react-router-dom'
import { Landmark, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useData } from '@/context/DataContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/formatters'

export default function DashboardPage() {
  const { loans, customers, getCustomerById } = useData()
  const { t } = useTranslation()

  const active = loans.filter(l => l.status === 'Active')
  const overdue = loans.filter(l => l.status === 'Overdue')
  const closed = loans.filter(l => l.status === 'Closed')
  const totalPortfolio = loans
    .filter(l => l.status !== 'Closed')
    .reduce((sum, l) => sum + l.remainingBalance, 0)

  const recentLoans = [...loans]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const statCards = [
    {
      title: t('dashboard.activeLoans'),
      value: active.length,
      sub: formatCurrency(active.reduce((s, l) => s + l.loanAmount, 0)),
      icon: Landmark,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: t('dashboard.overdueLoans'),
      value: overdue.length,
      sub: formatCurrency(overdue.reduce((s, l) => s + l.remainingBalance, 0)),
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950',
    },
    {
      title: t('dashboard.closedLoans'),
      value: closed.length,
      sub: t('dashboard.totalCustomers', { count: customers.length }),
      icon: CheckCircle2,
      color: 'text-gray-500',
      bg: 'bg-gray-50 dark:bg-gray-800',
    },
    {
      title: t('dashboard.totalPortfolio'),
      value: formatCurrency(totalPortfolio),
      sub: t('dashboard.openLoans', { count: loans.filter(l => l.status !== 'Closed').length }),
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950',
      wide: true,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.filter(c => !c.wide).map(card => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-md p-1.5 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
        {statCards.filter(c => c.wide).map(card => (
          <Card key={card.title} className="col-span-2 lg:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-md p-1.5 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent loans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('dashboard.recentLoans')}</CardTitle>
          <Link to="/loans" className="text-sm text-amber-600 hover:underline">{t('dashboard.viewAll')}</Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.loanId')}</TableHead>
                <TableHead>{t('table.customer')}</TableHead>
                <TableHead>{t('table.amount')}</TableHead>
                <TableHead>{t('table.period')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLoans.map(loan => {
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
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}
                    </TableCell>
                    <TableCell><StatusBadge status={loan.status} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
