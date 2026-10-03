import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters'
import type { Branch, Loan } from '@/types'

interface BranchProfitCardProps {
  title: string
  /** Loans already filtered to the statuses relevant to this card. */
  loans: Loan[]
  /** Branches sorted for stable display order. */
  branches: Branch[]
  branchesLoading: boolean
  /** Per-loan profit contribution for this card. */
  profitOf: (loan: Loan) => number
}

/**
 * Date-range-filtered, per-branch profit breakdown. Filters loans by
 * `createdAt` and sums `profitOf` per branch, with an "Unassigned" bucket
 * for loans with no (or a stale) branchId.
 */
export default function BranchProfitCard({ title, loans, branches, branchesLoading, profitOf }: BranchProfitCardProps) {
  const { t } = useTranslation()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const invalidRange = Boolean(start && end && end < start)

  const rangedLoans = useMemo(() => {
    if (invalidRange) return []
    return loans.filter(l => {
      const created = l.createdAt.slice(0, 10)
      if (start && created < start) return false
      if (end && created > end) return false
      return true
    })
  }, [loans, start, end, invalidRange])

  const sumProfit = (list: Loan[]) => list.reduce((s, l) => s + profitOf(l), 0)

  const branchProfits = useMemo(
    () => branches.map(branch => {
      const branchLoans = rangedLoans.filter(l => l.branchId === branch.id)
      return { id: branch.id, name: branch.branchName, profit: sumProfit(branchLoans), loanCount: branchLoans.length }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [branches, rangedLoans]
  )

  const unassignedLoans = rangedLoans.filter(l => !l.branchId || !branches.some(b => b.id === l.branchId))
  const unassignedProfit = sumProfit(unassignedLoans)

  function handleClearDates() {
    setStart('')
    setEnd('')
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reports.startDate')}</label>
            <Input
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="h-8 w-auto"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">{t('reports.endDate')}</label>
            <Input
              type="date"
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="h-8 w-auto"
            />
          </div>
          {(start || end) && (
            <Button variant="ghost" size="sm" onClick={handleClearDates}>
              {t('reports.clearDates')}
            </Button>
          )}
        </div>

        {invalidRange ? (
          <p className="text-sm text-red-600">{t('reports.invalidRange')}</p>
        ) : !branchesLoading && branchProfits.length === 0 && unassignedLoans.length === 0 ? (
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
  )
}
