import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useData } from '@/context/DataContext'
import { useBranches } from '@/hooks/useBranches'
import { settingsService } from '@/services/settingsService'
import type { LedgerSettings } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface LedgerRow {
  loanId: string
  voucher: string
  date: string
  debit: number | null
  credit: number | null
}

export default function InitialBalanceLedger() {
  const { loans } = useData()
  const { branches, loading: branchesLoading } = useBranches()
  const { t } = useTranslation()

  const sortedBranches = useMemo(
    () => [...branches].sort((a, b) => a.branchName.localeCompare(b.branchName)),
    [branches]
  )

  const [selectedBranchId, setSelectedBranchId] = useState('')
  const effectiveBranchId = selectedBranchId || sortedBranches[0]?.id || ''

  const [settingsItems, setSettingsItems] = useState<LedgerSettings[]>([])
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = settingsService.subscribe(setSettingsItems, err => console.error('[InitialBalanceLedger]', err))
    return unsub
  }, [])

  const openingBalance = settingsItems.find(i => i.branchId === effectiveBranchId)?.openingBalance ?? 0

  async function handleSave() {
    const val = parseFloat(inputRef.current?.value ?? '')
    if (isNaN(val) || val < 0 || !effectiveBranchId) return
    const docId = `ledger-${effectiveBranchId}`
    setSaving(true)
    try {
      await settingsService.setDoc(docId, { id: docId, branchId: effectiveBranchId, openingBalance: val })
    } finally {
      setSaving(false)
    }
  }

  const branchLoans = loans.filter(l => l.branchId === effectiveBranchId)

  const rows: LedgerRow[] = []
  for (const loan of branchLoans) {
    const voucher = loan.physicalBillNumber || '—'
    rows.push({ loanId: loan.id, voucher, date: loan.createdAt, debit: null, credit: loan.loanAmount })
    if (loan.status === 'Closed') {
      rows.push({ loanId: loan.id, voucher, date: loan.periodTo, debit: loan.totalRepayment, credit: null })
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date))

  let running = openingBalance
  const displayRows = rows.map(row => {
    running = running + (row.debit ?? 0) - (row.credit ?? 0)
    return { ...row, balance: running }
  })

  if (!branchesLoading && sortedBranches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('reports.initialBalance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-8 text-center">{t('reports.noBranches')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('reports.initialBalance')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 max-w-sm">
          <label className="text-sm font-medium whitespace-nowrap">
            {t('reports.branch')}
          </label>
          <NativeSelect
            value={effectiveBranchId}
            onChange={e => setSelectedBranchId(e.target.value)}
            disabled={branchesLoading}
            size="sm"
          >
            {sortedBranches.map(b => (
              <NativeSelectOption key={b.id} value={b.id}>{b.branchName}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <label className="text-sm font-medium whitespace-nowrap">
            {t('reports.openingBalance')}
          </label>
          <Input
            key={`${effectiveBranchId}-${openingBalance}`}
            ref={inputRef}
            type="number"
            min={0}
            defaultValue={String(openingBalance)}
            className="h-8"
            disabled={!effectiveBranchId}
          />
          <Button size="sm" onClick={handleSave} disabled={saving || !effectiveBranchId}>
            {t('reports.saveBalance')}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.loanId')}</TableHead>
              <TableHead>{t('reports.voucher')}</TableHead>
              <TableHead>{t('table.date')}</TableHead>
              <TableHead className="text-end">{t('reports.debit')}</TableHead>
              <TableHead className="text-end">{t('reports.credit')}</TableHead>
              <TableHead className="text-end">{t('reports.balance')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Opening balance row */}
            <TableRow className="font-semibold bg-muted/40">
              <TableCell>{t('reports.openingBalanceRow')}</TableCell>
              <TableCell>—</TableCell>
              <TableCell>—</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-end">{formatCurrency(openingBalance)}</TableCell>
            </TableRow>

            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t('reports.noTransactions')}
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, i) => (
                <TableRow key={`${row.loanId}-${row.date}-${i}`}>
                  <TableCell className="font-medium text-amber-600">
                    <Link to={`/loans/${row.loanId}`} className="hover:underline">{row.loanId}</Link>
                  </TableCell>
                  <TableCell className="font-medium">{row.voucher}</TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="text-end text-green-700">
                    {row.debit != null ? formatCurrency(row.debit) : ''}
                  </TableCell>
                  <TableCell className="text-end text-red-600">
                    {row.credit != null ? formatCurrency(row.credit) : ''}
                  </TableCell>
                  <TableCell className="text-end font-medium">{formatCurrency(row.balance)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
