import { useState } from 'react'
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
          <DialogTitle>Loan Approval Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">{customer.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ID Number</p>
                <p className="font-medium">{customer.idNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gold Weight</p>
                <p className="font-medium">{loan.goldWeight}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Loan Term</p>
                <p className="font-medium">{loan.termMonths} months</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Period</p>
                <p className="font-medium">{formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="font-medium">{loan.interestRate}%</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Loan Amount</p>
                <p className="font-semibold">{formatCurrency(loan.loanAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interest</p>
                <p className="font-semibold">{formatCurrency(loan.interestAmount)}</p>
              </div>
              {loan.lateFeePerMonth > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Late Fee (if overdue)</p>
                  <p className="font-semibold text-muted-foreground">{formatCurrency(loan.lateFeePerMonth)}/mo</p>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Total Repayment</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(loan.totalRepayment)}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="approvalNotes">Approval Notes (optional)</Label>
            <Textarea
              id="approvalNotes"
              placeholder="Add any notes for this approval decision…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="destructive" onClick={handleReject} disabled={saving}>
            Reject
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={saving}>
            {saving ? 'Saving…' : 'Approve Loan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
