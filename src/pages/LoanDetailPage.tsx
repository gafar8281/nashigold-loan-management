import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, MessageCircle, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { calcRemainingBalance, calcDaysOverdue, isOverdue, calcEffectiveLateFee, calcDiscountedRepayment, calcTermMonths, calcInterestAmount, calcTotalRepayment } from '@/lib/calculations'
import type { DiscountType } from '@/types'
import EditLoanDialog from '@/components/loans/EditLoanDialog'
import type { Loan } from '@/types'

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getLoanById, getCustomerById, updateLoan } = useData()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const loan = getLoanById(id!)
  const customer = loan ? getCustomerById(loan.customerId) : undefined

  const [paymentAmount, setPaymentAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [closeError, setCloseError] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [discountValue, setDiscountValue] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('percentage')
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [periodFrom, setPeriodFrom] = useState(loan?.periodFrom ?? '')
  const [periodTo, setPeriodTo] = useState(loan?.periodTo ?? '')
  const [periodSyncedFor, setPeriodSyncedFor] = useState(loan?.id)
  const [updatingPeriod, setUpdatingPeriod] = useState(false)
  const [periodError, setPeriodError] = useState<string | null>(null)
  const [lateFeeValue, setLateFeeValue] = useState(loan?.lateFeePerMonth != null ? String(loan.lateFeePerMonth) : '0')
  const [updatingLateFee, setUpdatingLateFee] = useState(false)
  const [lateFeeError, setLateFeeError] = useState<string | null>(null)

  if (loan && loan.id !== periodSyncedFor) {
    setPeriodSyncedFor(loan.id)
    setPeriodFrom(loan.periodFrom)
    setPeriodTo(loan.periodTo)
    setLateFeeValue(String(loan.lateFeePerMonth))
  }

  const effectiveLateFee = loan ? calcEffectiveLateFee(loan.lateFeePerMonth, loan.periodTo, loan.status) : 0
  const effectiveTotalRepayment = loan ? loan.totalRepayment + effectiveLateFee : 0
  const effectiveOutstanding = loan ? Math.max(0, effectiveTotalRepayment - loan.amountPaid) : 0

  if (!loan) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t('loans.notFound')}</p>
        <Button variant="link" className="ps-0 mt-2" onClick={() => navigate('/loans')}>{t('loans.backToLoans')}</Button>
      </div>
    )
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0 || !loan) return
    if (amount > effectiveOutstanding) {
      setPaymentError(t('loans.paymentExceedsBalance', { amount: formatCurrency(effectiveOutstanding) }))
      return
    }
    const newAmountPaid = loan.amountPaid + amount
    const newRemaining = calcRemainingBalance(effectiveTotalRepayment, newAmountPaid)
    setSaving(true)
    try {
      await updateLoan(loan.id, {
        amountPaid: newAmountPaid,
        remainingBalance: newRemaining,
      })
      setPaymentAmount('')
      setCloseError(false)
      setPaymentError(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseLoan() {
    if (!loan) return
    if (effectiveOutstanding > 0) {
      setCloseError(true)
      return
    }
    setSaving(true)
    try {
      await updateLoan(loan.id, { status: 'Closed' })
    } finally {
      setSaving(false)
    }
  }

  async function handleApplyDiscount() {
    if (!loan) return
    const discount = parseFloat(discountValue)
    if (!discount || discount <= 0) return
    const baseRepayment = loan.loanAmount + loan.interestAmount
    if (discountType === 'percentage' && discount > 100) {
      setDiscountError(t('loans.discountExceedsRepayment'))
      return
    }
    if (discountType === 'fixed' && discount > baseRepayment) {
      setDiscountError(t('loans.discountExceedsRepayment'))
      return
    }
    const newTotal = calcDiscountedRepayment(baseRepayment, discount, discountType)
    const newRemaining = Math.max(0, newTotal - loan.amountPaid)
    setApplyingDiscount(true)
    try {
      await updateLoan(loan.id, {
        discount,
        discountType,
        totalRepayment: newTotal,
        remainingBalance: newRemaining,
      })
      setDiscountValue('')
      setDiscountError(null)
    } finally {
      setApplyingDiscount(false)
    }
  }

  async function handleUpdatePeriod() {
    if (!loan) return
    if (!periodFrom || !periodTo) return
    if (new Date(periodTo) <= new Date(periodFrom)) {
      setPeriodError(t('loans.periodToBeforeFrom'))
      return
    }
    const termMonths = calcTermMonths(periodFrom, periodTo)
    const interestAmount = calcInterestAmount(loan.loanAmount, loan.interestRate, termMonths, loan.interestType)
    const baseTotal = calcTotalRepayment(loan.loanAmount, interestAmount)
    const totalRepayment = calcDiscountedRepayment(baseTotal, loan.discount ?? 0, loan.discountType ?? 'percentage')
    const remainingBalance = calcRemainingBalance(totalRepayment, loan.amountPaid)
    setUpdatingPeriod(true)
    try {
      await updateLoan(loan.id, {
        periodFrom,
        periodTo,
        termMonths,
        interestAmount,
        totalRepayment,
        remainingBalance,
      })
      setPeriodError(null)
    } finally {
      setUpdatingPeriod(false)
    }
  }

  async function handleUpdateLateFee() {
    if (!loan) return
    const fee = parseFloat(lateFeeValue)
    if (isNaN(fee) || fee < 0) {
      setLateFeeError(t('loans.invalidLateFee'))
      return
    }
    const newEffectiveLateFee = calcEffectiveLateFee(fee, loan.periodTo, loan.status)
    const newRemaining = calcRemainingBalance(loan.totalRepayment + newEffectiveLateFee, loan.amountPaid)
    setUpdatingLateFee(true)
    try {
      await updateLoan(loan.id, {
        lateFeePerMonth: fee,
        remainingBalance: newRemaining,
      })
      setLateFeeError(null)
    } finally {
      setUpdatingLateFee(false)
    }
  }

  const canClose = loan.status !== 'Closed'

  function handleSendWhatsApp() {
    if (!customer || !loan) return
    const daysOverdue = calcDaysOverdue(loan.periodTo)
    const message = [
      t('loans.whatsapp.greeting', { name: customer.fullName }),
      '',
      t('loans.whatsapp.body', {
        count: daysOverdue,
        amount: formatCurrency(effectiveOutstanding),
        date: formatDate(loan.periodTo),
      }),
      '',
      t('loans.whatsapp.cta'),
      '',
      t('loans.whatsapp.closing'),
    ].join('\n')
    const phone = customer.mobile.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const termUnit = loan.termMonths === 1 ? t('common.month') : t('common.months')

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/loans')}>
          <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" />
          {t('loans.title')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{loan.id}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={loan.status} />
            <span className="text-sm text-muted-foreground">{t('loans.createdOn', { date: formatDate(loan.createdAt) })}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOverdue(loan.periodTo, loan.status) && (
            <Button variant="outline" size="sm" className="gap-1.5 text-green-700 border-green-300" onClick={handleSendWhatsApp}>
              <MessageCircle className="h-4 w-4" />
              {t('loans.sendWhatsApp')}
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingLoan(loan)}>
              <Pencil className="h-4 w-4" />
              {t('loans.editLoan')}
            </Button>
          )}
          {canClose && (
            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 ${effectiveOutstanding <= 0 ? 'text-green-700 border-green-300' : ''}`}
              onClick={handleCloseLoan}
              disabled={saving}
            >
              <CheckCircle className="h-4 w-4" />
              {effectiveOutstanding <= 0 ? t('loans.markClosed') : t('loans.closeLoan')}
            </Button>
          )}
        </div>
      </div>

      {closeError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {t('loans.cannotClose', { amount: formatCurrency(effectiveOutstanding) })}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Loan details */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('loans.details')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('table.customer')}</span>
              <Link to={`/customers/${loan.customerId}`} className="font-medium text-amber-600 hover:underline">
                {customer?.fullName ?? loan.customerId}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('table.idNumber')}</span>
              <span>{customer?.idNumber ?? '—'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('table.period')}</span>
              <span>{formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('table.term')}</span>
              <span>{loan.termMonths} {termUnit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('table.goldWeight')}</span>
              <span>{loan.goldWeight}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('loans.physicalBillNo')}</span>
              <span>{loan.physicalBillNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('table.interestRate')}</span>
              <span>
                {loan.interestType === 'fixed'
                  ? `${formatCurrency(loan.interestRate)} (${t('loans.interestTypeFixed')})`
                  : `${loan.interestRate}%`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Financial summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('loans.financialSummary')}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('table.loanAmount')}</span>
              <span className="font-medium">{formatCurrency(loan.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('loans.interest')}</span>
              <span>{formatCurrency(loan.interestAmount)}</span>
            </div>
            {(loan.discount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('loans.discountAmount', { rate: loan.discount })}</span>
                <span className="text-green-600">- {formatCurrency(loan.loanAmount + loan.interestAmount - loan.totalRepayment)}</span>
              </div>
            )}
            {loan.lateFeePerMonth > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isOverdue(loan.periodTo, loan.status)
                    ? t('loans.lateFeeActive')
                    : t('loans.lateFeeIfOverdue')}
                </span>
                <span className={isOverdue(loan.periodTo, loan.status) ? 'text-red-600' : 'text-muted-foreground'}>
                  {isOverdue(loan.periodTo, loan.status)
                    ? formatCurrency(effectiveLateFee)
                    : t('loans.lateFeeAmount', { amount: formatCurrency(loan.lateFeePerMonth) })}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('loans.totalRepayment')}</span>
              <span className="font-semibold">{formatCurrency(effectiveTotalRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('loans.amountPaid')}</span>
              <span className="text-green-700 font-medium">{formatCurrency(loan.amountPaid)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('table.remainingBalance')}</span>
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
          <CardHeader><CardTitle className="text-base">{t('loans.recordPayment')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Discount row — independent action */}
            <div className="flex items-end gap-3 max-w-sm">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="discount">
                  {discountType === 'percentage' ? t('loans.discountLabel') : t('loans.discountValueLabel')}
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={discountValue}
                  onChange={e => { setDiscountValue(e.target.value); setDiscountError(null) }}
                />
                {discountError && (
                  <p className="text-sm text-red-600">{discountError}</p>
                )}
              </div>
              <div className="flex border rounded-md overflow-hidden">
                <button
                  type="button"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${discountType === 'percentage' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  onClick={() => setDiscountType('percentage')}
                >
                  {t('loans.discountTypePct')}
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${discountType === 'fixed' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  onClick={() => setDiscountType('fixed')}
                >
                  {t('loans.discountTypeFixed')}
                </button>
              </div>
              <Button type="button" variant="outline" onClick={handleApplyDiscount} disabled={applyingDiscount || !discountValue}>
                {applyingDiscount ? t('common.saving') : t('loans.applyDiscount')}
              </Button>
            </div>

            {/* Period edit row */}
            <div className="flex items-end gap-3 max-w-md">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="periodFromEdit">{t('loans.periodFrom')}</Label>
                <Input
                  id="periodFromEdit"
                  type="date"
                  value={periodFrom}
                  onChange={e => { setPeriodFrom(e.target.value); setPeriodError(null) }}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="periodToEdit">{t('loans.periodTo')}</Label>
                <Input
                  id="periodToEdit"
                  type="date"
                  value={periodTo}
                  onChange={e => { setPeriodTo(e.target.value); setPeriodError(null) }}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleUpdatePeriod} disabled={updatingPeriod}>
                {updatingPeriod ? t('common.saving') : t('common.update')}
              </Button>
            </div>
            {periodError && (
              <p className="text-sm text-red-600">{periodError}</p>
            )}

            {/* Late fee edit row */}
            <div className="flex items-end gap-3 max-w-sm">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="lateFeeEdit">{t('loans.lateFeeLabel')} (SAR)</Label>
                <Input
                  id="lateFeeEdit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={lateFeeValue}
                  onChange={e => { setLateFeeValue(e.target.value); setLateFeeError(null) }}
                />
              </div>
              <Button type="button" variant="outline" onClick={handleUpdateLateFee} disabled={updatingLateFee}>
                {updatingLateFee ? t('common.saving') : t('common.update')}
              </Button>
            </div>
            {lateFeeError && (
              <p className="text-sm text-red-600">{lateFeeError}</p>
            )}

            <Separator />

            {/* Payment row */}
            <form onSubmit={handlePayment} className="flex items-end gap-3 max-w-sm">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="payment">{t('loans.paymentAmount')}</Label>
                <Input
                  id="payment"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={e => { setPaymentAmount(e.target.value); setPaymentError(null) }}
                  required
                />
                {paymentError && (
                  <p className="text-sm text-red-600">{paymentError}</p>
                )}
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? t('common.saving') : t('loans.recordPayment')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <EditLoanDialog loan={editingLoan} onClose={() => setEditingLoan(null)} />
    </div>
  )
}