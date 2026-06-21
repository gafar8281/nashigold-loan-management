import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Loan, Customer } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'

interface Props {
  open: boolean
  loan: Loan
  customer: Customer
  onApprove: () => void
  onReject: () => void
  saving: boolean
}

export default function ApprovalModal({ open, loan, customer, onApprove, onReject, saving }: Props) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState('')

  function handleApprove() {
    onApprove()
    setNotes('')
  }

  function handleReject() {
    setNotes('')
    onReject()
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('approval.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('approval.customer')}</p>
                <p className="font-medium">{customer.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('approval.idNumber')}</p>
                <p className="font-medium">{customer.idNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('approval.goldWeight')}</p>
                <p className="font-medium">{loan.goldWeight}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('approval.loanTerm')}</p>
                <p className="font-medium">{loan.termMonths} {loan.termMonths === 1 ? t('common.month') : t('common.months')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('approval.period')}</p>
                <p className="font-medium">{formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {loan.interestType === 'fixed' ? t('approval.interestRateFixed') : t('approval.interestRate')}
                </p>
                <p className="font-medium">
                  {loan.interestType === 'fixed' ? formatCurrency(loan.interestRate) : `${loan.interestRate}%`}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t('approval.loanAmount')}</p>
                <p className="font-semibold">{formatCurrency(loan.loanAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('approval.interest')}</p>
                <p className="font-semibold">{formatCurrency(loan.interestAmount)}</p>
              </div>
              {loan.lateFeePerMonth > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">{t('approval.lateFeeIfOverdue')}</p>
                  <p className="font-semibold text-muted-foreground">{t('loans.lateFeeMonthly', { amount: formatCurrency(loan.lateFeePerMonth) })}</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">{t('approval.totalRepayment')}</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(loan.totalRepayment)}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="approvalNotes">{t('approval.notes')}</Label>
            <Textarea
              id="approvalNotes"
              placeholder={t('approval.notesPlaceholder')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="destructive" onClick={handleReject} disabled={saving}>
            {t('approval.reject')}
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={saving}>
            {saving ? t('approval.saving') : t('approval.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
