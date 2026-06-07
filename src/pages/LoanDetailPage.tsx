import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, MessageCircle, Pencil } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { calcRemainingBalance, calcDaysOverdue, isOverdue, calcEffectiveLateFee, calcMonthsOverdue } from '@/lib/calculations'
import EditLoanDialog from '@/components/loans/EditLoanDialog'
import type { Loan } from '@/types'

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getLoanById, getCustomerById, updateLoan } = useData()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  const loan = getLoanById(id!)
  const customer = loan ? getCustomerById(loan.customerId) : undefined

  const [paymentAmount, setPaymentAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)

  const effectiveLateFee = loan ? calcEffectiveLateFee(loan.lateFeePerMonth, loan.periodTo, loan.status) : 0
  const effectiveTotalRepayment = loan ? loan.totalRepayment + effectiveLateFee : 0
  const effectiveOutstanding = loan ? Math.max(0, effectiveTotalRepayment - loan.amountPaid) : 0

  if (!loan) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loan not found.</p>
        <Button variant="link" className="pl-0 mt-2" onClick={() => navigate('/loans')}>Back to loans</Button>
      </div>
    )
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0 || !loan) return
    const newAmountPaid = loan.amountPaid + amount
    const newRemaining = calcRemainingBalance(effectiveTotalRepayment, newAmountPaid)
    setSaving(true)
    try {
      await updateLoan(loan.id, {
        amountPaid: newAmountPaid,
        remainingBalance: newRemaining,
      })
      setPaymentAmount('')
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseLoan() {
    if (!loan) return
    setSaving(true)
    try {
      await updateLoan(loan.id, { status: 'Closed' })
    } finally {
      setSaving(false)
    }
  }

  const canClose = loan.status !== 'Closed'

  function handleSendWhatsApp() {
    if (!customer || !loan) return
    const daysOverdue = calcDaysOverdue(loan.periodTo)
    const message = [
      `Dear ${customer.fullName},`,
      ``,
      `This is a reminder that your gold loan is overdue.`,
      ``,
      `Loan Number: ${loan.id}`,
      `Due Date: ${formatDate(loan.periodTo)}`,
      `Days Overdue: ${daysOverdue} day(s)`,
      `Outstanding Balance: ${formatCurrency(effectiveOutstanding)}`,
      ``,
      `Please visit the branch or contact us to settle the outstanding amount.`,
    ].join('\n')
    const phone = customer.mobile.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/loans')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Loans
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{loan.id}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={loan.status} />
            <span className="text-sm text-muted-foreground">Created {formatDate(loan.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOverdue(loan.periodTo, loan.status) && (
            <Button variant="outline" size="sm" className="gap-1.5 text-green-700 border-green-300" onClick={handleSendWhatsApp}>
              <MessageCircle className="h-4 w-4" />
              Send WhatsApp
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingLoan(loan)}>
              <Pencil className="h-4 w-4" />
              Edit Loan
            </Button>
          )}
          {canClose && effectiveOutstanding <= 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-green-700 border-green-300" onClick={handleCloseLoan} disabled={saving}>
              <CheckCircle className="h-4 w-4" />
              Mark Closed
            </Button>
          )}
          {canClose && effectiveOutstanding > 0 && (
            <Button variant="outline" size="sm" onClick={handleCloseLoan} disabled={saving}>
              Close Loan
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Loan details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Loan Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <Link to={`/customers/${loan.customerId}`} className="font-medium text-amber-600 hover:underline">
                {customer?.fullName ?? loan.customerId}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer ID</span>
              <span>{customer?.idNumber ?? '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span>{formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Term</span>
              <span>{loan.termMonths} months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gold Weight</span>
              <span>{loan.goldWeight}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Physical Bill No.</span>
              <span>{loan.physicalBillNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interest Rate</span>
              <span>{loan.interestRate}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount</span>
              <span className="font-medium">{formatCurrency(loan.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interest</span>
              <span>{formatCurrency(loan.interestAmount)}</span>
            </div>
            {loan.lateFeePerMonth > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isOverdue(loan.periodTo, loan.status)
                    ? `Late Fee (${calcMonthsOverdue(loan.periodTo)} month${calcMonthsOverdue(loan.periodTo) !== 1 ? 's' : ''})`
                    : 'Monthly Late Fee (if overdue)'}
                </span>
                <span className={isOverdue(loan.periodTo, loan.status) ? 'text-red-600' : 'text-muted-foreground'}>
                  {isOverdue(loan.periodTo, loan.status)
                    ? formatCurrency(effectiveLateFee)
                    : `${formatCurrency(loan.lateFeePerMonth)}/mo`}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Repayment</span>
              <span className="font-semibold">{formatCurrency(effectiveTotalRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="text-green-700 font-medium">{formatCurrency(loan.amountPaid)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Remaining Balance</span>
              <span className={`text-lg font-bold ${effectiveOutstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {formatCurrency(effectiveOutstanding)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment section */}
      {loan.status !== 'Closed' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Record Payment</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="flex items-end gap-3 max-w-sm">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="payment">Payment Amount (SAR)</Label>
                <Input
                  id="payment"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <EditLoanDialog loan={editingLoan} onClose={() => setEditingLoan(null)} />
    </div>
  )
}
