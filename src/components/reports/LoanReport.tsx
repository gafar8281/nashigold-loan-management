import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { useBranches } from '@/hooks/useBranches'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import StatusBadge from '@/components/shared/StatusBadge'
import TablePagination from '@/components/shared/TablePagination'
import { formatCurrency, formatDate, formatDateISO, todayISO } from '@/lib/formatters'
import { calcEffectiveLateFee } from '@/lib/calculations'
import { toCsv, downloadCsv } from '@/lib/csv'
import type { Loan } from '@/types'

const PAGE_SIZE = 50
const UNASSIGNED = '__unassigned__'

function monthStartISO(): string {
  const now = new Date()
  return formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1))
}

export default function LoanReport() {
  const { loans, getCustomerById } = useData()
  const { branches, loading: branchesLoading } = useBranches()
  const { t } = useTranslation()

  const [startDate, setStartDate] = useState(monthStartISO())
  const [endDate, setEndDate] = useState(todayISO())
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [page, setPage] = useState(1)

  const invalidRange = Boolean(startDate && endDate && endDate < startDate)

  const sortedBranches = useMemo(
    () => [...branches].sort((a, b) => a.branchName.localeCompare(b.branchName)),
    [branches]
  )

  const branchNameById = useMemo(
    () => new Map(branches.map(b => [b.id, b.branchName])),
    [branches]
  )

  const knownBranchIds = useMemo(() => new Set(branches.map(b => b.id)), [branches])
  const isUnassigned = (l: Loan) => !l.branchId || !knownBranchIds.has(l.branchId)

  const hasUnassignedLoans = useMemo(
    () => loans.some(isUnassigned),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loans, knownBranchIds]
  )

  const filteredLoans = useMemo(() => {
    if (invalidRange) return []
    return loans
      .filter(l => {
        const created = l.createdAt.slice(0, 10)
        if (startDate && created < startDate) return false
        if (endDate && created > endDate) return false
        if (selectedBranchId === UNASSIGNED) {
          if (!isUnassigned(l)) return false
        } else if (selectedBranchId && l.branchId !== selectedBranchId) {
          return false
        }
        return true
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loans, startDate, endDate, invalidRange, selectedBranchId, knownBranchIds])

  const totalPages = Math.ceil(filteredLoans.length / PAGE_SIZE)
  const paginatedLoans = filteredLoans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totals = useMemo(() => filteredLoans.reduce((acc, l) => ({
    loanAmount: acc.loanAmount + l.loanAmount,
    totalRepayment: acc.totalRepayment + l.totalRepayment,
    remainingBalance: acc.remainingBalance + l.remainingBalance,
  }), { loanAmount: 0, totalRepayment: 0, remainingBalance: 0 }), [filteredLoans])

  function handleStartDateChange(value: string) {
    setStartDate(value)
    setPage(1)
  }

  function handleEndDateChange(value: string) {
    setEndDate(value)
    setPage(1)
  }

  function handleBranchChange(value: string) {
    setSelectedBranchId(value)
    setPage(1)
  }

  function branchLabelFor(loan: Loan): string {
    return (loan.branchId && branchNameById.get(loan.branchId)) || t('reports.unassignedBranch')
  }

  function handleExport() {
    const headers = [
      t('table.loanId'),
      t('loans.physicalBillNo'),
      t('table.customer'),
      t('reports.branch'),
      t('table.customerId'),
      t('table.created'),
      t('loans.periodFrom'),
      t('loans.periodTo'),
      t('table.term'),
      t('table.goldWeight'),
      t('table.loanAmount'),
      t('table.interestRate'),
      t('loans.interest'),
      t('loans.lateFeeLabel'),
      t('loans.totalRepayment'),
      t('loans.amountPaid'),
      t('table.remainingBalance'),
      t('table.status'),
    ]

    const rows: (string | number)[][] = filteredLoans.map(loan => {
      const customer = getCustomerById(loan.customerId)
      const lateFee = calcEffectiveLateFee(loan.lateFeePerMonth, loan.periodTo, loan.status)
      const interestDisplay = loan.interestType === 'fixed'
        ? `${loan.interestRate} SAR`
        : `${loan.interestRate}%`
      return [
        loan.id,
        loan.physicalBillNumber || '—',
        customer?.fullName ?? '—',
        branchLabelFor(loan),
        loan.customerId,
        formatDate(loan.createdAt),
        formatDate(loan.periodFrom),
        formatDate(loan.periodTo),
        loan.termMonths,
        loan.goldWeight,
        loan.loanAmount,
        interestDisplay,
        loan.interestAmount,
        lateFee,
        loan.totalRepayment,
        loan.amountPaid,
        loan.remainingBalance,
        loan.status,
      ]
    })

    const totalLateFee = filteredLoans.reduce(
      (s, l) => s + calcEffectiveLateFee(l.lateFeePerMonth, l.periodTo, l.status),
      0
    )
    const totalInterest = filteredLoans.reduce((s, l) => s + l.interestAmount, 0)
    const totalPaid = filteredLoans.reduce((s, l) => s + l.amountPaid, 0)

    rows.push([
      t('reports.total'), '', '', '', '', '', '', '', '', '',
      totals.loanAmount,
      '',
      totalInterest,
      totalLateFee,
      totals.totalRepayment,
      totalPaid,
      totals.remainingBalance,
      '',
    ])

    const branchLabel = selectedBranchId === UNASSIGNED
      ? 'unassigned'
      : selectedBranchId
        ? (branchNameById.get(selectedBranchId) ?? selectedBranchId)
        : ''

    downloadCsv(
      `loan-report-${branchLabel ? `${branchLabel}-` : ''}${startDate || 'start'}-to-${endDate || todayISO()}.csv`,
      toCsv(headers, rows)
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base">{t('reports.loanReport')} ({filteredLoans.length})</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={filteredLoans.length === 0}
        >
          <Download className="h-4 w-4" />
          {t('reports.downloadCsv')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reports.startDate')}</label>
            <Input
              type="date"
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
              className="h-8 w-auto"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reports.endDate')}</label>
            <Input
              type="date"
              value={endDate}
              onChange={e => handleEndDateChange(e.target.value)}
              className="h-8 w-auto"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reports.branch')}</label>
            <NativeSelect
              value={selectedBranchId}
              onChange={e => handleBranchChange(e.target.value)}
              disabled={branchesLoading}
              size="sm"
            >
              <NativeSelectOption value="">{t('reports.allBranches')}</NativeSelectOption>
              {sortedBranches.map(b => (
                <NativeSelectOption key={b.id} value={b.id}>{b.branchName}</NativeSelectOption>
              ))}
              {hasUnassignedLoans && (
                <NativeSelectOption value={UNASSIGNED}>{t('reports.unassignedBranch')}</NativeSelectOption>
              )}
            </NativeSelect>
          </div>
        </div>

        {invalidRange ? (
          <p className="text-sm text-red-600">{t('reports.invalidRange')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground font-medium">{t('reports.loansInRange', { count: filteredLoans.length })}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground font-medium">{t('table.loanAmount')}</p>
              <p className="text-lg font-bold mt-0.5">{formatCurrency(totals.loanAmount)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground font-medium">{t('loans.totalRepayment')}</p>
              <p className="text-lg font-bold mt-0.5">{formatCurrency(totals.totalRepayment)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground font-medium">{t('table.remainingBalance')}</p>
              <p className="text-lg font-bold text-amber-600 mt-0.5">{formatCurrency(totals.remainingBalance)}</p>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.loanId')}</TableHead>
              <TableHead>{t('table.customer')}</TableHead>
              <TableHead>{t('reports.branch')}</TableHead>
              <TableHead>{t('table.created')}</TableHead>
              <TableHead>{t('table.loanAmount')}</TableHead>
              <TableHead>{t('loans.totalRepayment')}</TableHead>
              <TableHead>{t('table.remainingBalance')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLoans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {t('reports.noLoansInRange')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedLoans.map(loan => {
                const customer = getCustomerById(loan.customerId)
                return (
                  <TableRow key={loan.id}>
                    <TableCell><Link to={`/loans/${loan.id}`} className="text-amber-600 hover:underline font-medium">{loan.id}</Link></TableCell>
                    <TableCell><Link to={`/customers/${loan.customerId}`} className="hover:underline">{customer?.fullName ?? '—'}</Link></TableCell>
                    <TableCell className="text-muted-foreground">{branchLabelFor(loan)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(loan.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                    <TableCell>{formatCurrency(loan.totalRepayment)}</TableCell>
                    <TableCell>{formatCurrency(loan.remainingBalance)}</TableCell>
                    <TableCell><StatusBadge status={loan.status} /></TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredLoans.length}
          pageSize={PAGE_SIZE}
          onPrev={() => setPage(p => p - 1)}
          onNext={() => setPage(p => p + 1)}
        />
      </CardContent>
    </Card>
  )
}
