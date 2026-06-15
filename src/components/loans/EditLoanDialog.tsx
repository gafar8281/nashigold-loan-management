import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useData } from '@/context/DataContext'
import StatusBadge from '@/components/shared/StatusBadge'
import {
  calcTermMonths,
  calcInterestAmount,
  calcTotalRepayment,
  calcRemainingBalance,
} from '@/lib/calculations'
import type { Loan } from '@/types'

interface Props {
  loan: Loan | null
  onClose: () => void
}

export default function EditLoanDialog({ loan, onClose }: Props) {
  const { updateLoan } = useData()
  const { t } = useTranslation()

  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [goldWeight, setGoldWeight] = useState('')
  const [physicalBillNumber, setPhysicalBillNumber] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [lateFeePerMonth, setLateFeePerMonth] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loan) return
    setPeriodFrom(loan.periodFrom)
    setPeriodTo(loan.periodTo)
    setGoldWeight(String(loan.goldWeight))
    setPhysicalBillNumber(loan.physicalBillNumber ?? '')
    setLoanAmount(String(loan.loanAmount))
    setInterestRate(String(loan.interestRate))
    setLateFeePerMonth(String(loan.lateFeePerMonth))
    setError(null)
  }, [loan])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!loan) return

    const termMonths = calcTermMonths(periodFrom, periodTo)
    const amount = parseFloat(loanAmount)
    const rate = parseFloat(interestRate)
    const fee = parseFloat(lateFeePerMonth) || 0
    const weight = parseFloat(goldWeight)
    const interestAmount = calcInterestAmount(amount, rate, termMonths)
    const totalRepayment = calcTotalRepayment(amount, interestAmount)
    const remainingBalance = calcRemainingBalance(totalRepayment, loan.amountPaid)

    setSaving(true)
    setError(null)
    try {
      await updateLoan(loan.id, {
        periodFrom,
        periodTo,
        termMonths,
        goldWeight: weight,
        physicalBillNumber: physicalBillNumber.trim(),
        loanAmount: amount,
        interestRate: rate,
        lateFeePerMonth: fee,
        interestAmount,
        totalRepayment,
        remainingBalance,
      })
      onClose()
    } catch (err) {
      setError((err as Error).message || 'Failed to update loan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!loan} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('loans.editLoan')} — {loan?.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editPeriodFrom">{t('loans.periodFrom')}</Label>
              <Input
                id="editPeriodFrom"
                type="date"
                value={periodFrom}
                onChange={e => setPeriodFrom(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editPeriodTo">{t('loans.periodTo')}</Label>
              <Input
                id="editPeriodTo"
                type="date"
                value={periodTo}
                onChange={e => setPeriodTo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editGoldWeight">{t('loans.goldWeightDisplay')}</Label>
              <Input
                id="editGoldWeight"
                type="number"
                min="0.001"
                step="0.001"
                value={goldWeight}
                onChange={e => setGoldWeight(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editPhysicalBillNumber">{t('loans.physicalBillNo')}</Label>
              <Input
                id="editPhysicalBillNumber"
                value={physicalBillNumber}
                onChange={e => setPhysicalBillNumber(e.target.value)}
                placeholder={t('loans.physicalBillPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="editLoanAmount">{t('loans.loanAmountLabel')}</Label>
            <Input
              id="editLoanAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="editInterestRate">{t('loans.interestRateLabel')}</Label>
              <Input
                id="editInterestRate"
                type="number"
                min="0"
                step="0.01"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editLateFeePerMonth">{t('loans.lateFeeLabel')} (SAR)</Label>
              <Input
                id="editLateFeePerMonth"
                type="number"
                min="0"
                step="0.01"
                value={lateFeePerMonth}
                onChange={e => setLateFeePerMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('table.status')}</Label>
            <div className="flex items-center h-9 px-3 rounded-md border border-input bg-muted/40">
              {loan && <StatusBadge status={loan.status} />}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
