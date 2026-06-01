import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ApprovalModal from '@/components/loans/ApprovalModal'
import {
  calcInterestAmount,
  calcTotalRepayment,
  calcRemainingBalance,
  calcTermMonths,
} from '@/lib/calculations'
import { formatCurrency, todayISO } from '@/lib/formatters'
import type { Loan } from '@/types'

export default function NewLoanPage() {
  const { customers, addLoan } = useData()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCustomerId = searchParams.get('customerId') ?? ''

  const [form, setForm] = useState({
    customerId: preselectedCustomerId,
    periodFrom: todayISO(),
    periodTo: '',
    loanAmount: '',
    goldWeight: '',
    interestRate: '5',
    lateFee: '0',
  })

  const [customerSearch, setCustomerSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [pendingLoan, setPendingLoan] = useState<Omit<Loan, 'id' | 'createdAt'> | null>(null)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const selectedCustomer = customers.find(c => c.id === form.customerId)

  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase()
    return c.fullName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
  })

  // Derived calculations
  const loanAmount = parseFloat(form.loanAmount) || 0
  const interestRate = parseFloat(form.interestRate) || 0
  const lateFee = parseFloat(form.lateFee) || 0
  const termMonths = form.periodFrom && form.periodTo
    ? calcTermMonths(form.periodFrom, form.periodTo)
    : 0
  const interestAmount = calcInterestAmount(loanAmount, interestRate, termMonths)
  const totalRepayment = calcTotalRepayment(loanAmount, interestAmount, lateFee)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerId || !selectedCustomer) return

    const loan: Omit<Loan, 'id' | 'createdAt'> = {
      customerId: form.customerId,
      periodFrom: form.periodFrom,
      periodTo: form.periodTo,
      termMonths,
      loanAmount,
      goldWeight: parseFloat(form.goldWeight) || 0,
      interestRate,
      lateFee,
      amountPaid: 0,
      interestAmount,
      totalRepayment,
      remainingBalance: calcRemainingBalance(totalRepayment, 0),
      status: 'Pending Approval',
      approvalNotes: '',
    }
    setPendingLoan(loan)
    setShowModal(true)
  }

  function handleApprove(notes: string) {
    if (!pendingLoan) return
    const saved = addLoan({ ...pendingLoan, status: 'Active', approvalNotes: notes })
    setShowModal(false)
    navigate(`/loans/${saved.id}`)
  }

  function handleReject() {
    setShowModal(false)
    setPendingLoan(null)
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/loans')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Loans
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">New Loan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fill in the details and submit for approval</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Form */}
          <Card>
            <CardHeader><CardTitle className="text-base">Loan Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Customer selection */}
              <div className="space-y-1.5">
                <Label>Customer</Label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{selectedCustomer.fullName}</p>
                      <p className="text-xs text-muted-foreground">{selectedCustomer.id} · {selectedCustomer.idNumber}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { set('customerId', ''); setCustomerSearch('') }}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Search customers…"
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                    />
                    {customerSearch && (
                      <div className="border rounded-md overflow-hidden">
                        {filteredCustomers.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground">No customers found</p>
                        ) : (
                          filteredCustomers.slice(0, 5).map(c => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-0"
                              onClick={() => { set('customerId', c.id); setCustomerSearch('') }}
                            >
                              <span className="font-medium">{c.fullName}</span>
                              <span className="text-muted-foreground ml-2">{c.id}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="periodFrom">Period From</Label>
                  <Input id="periodFrom" type="date" value={form.periodFrom} onChange={e => set('periodFrom', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="periodTo">Period To</Label>
                  <Input id="periodTo" type="date" value={form.periodTo} onChange={e => set('periodTo', e.target.value)} required />
                </div>
              </div>

              {termMonths > 0 && (
                <p className="text-xs text-muted-foreground">Term: {termMonths} month{termMonths !== 1 ? 's' : ''}</p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="loanAmount">Loan Amount (SAR)</Label>
                <Input id="loanAmount" type="number" min="1" step="0.01" value={form.loanAmount} onChange={e => set('loanAmount', e.target.value)} required placeholder="10000" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goldWeight">Gold Weight (grams)</Label>
                <Input id="goldWeight" type="number" min="0.1" step="0.1" value={form.goldWeight} onChange={e => set('goldWeight', e.target.value)} required placeholder="50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input id="interestRate" type="number" min="0" step="0.1" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lateFee">Late Fee (SAR)</Label>
                  <Input id="lateFee" type="number" min="0" step="0.01" value={form.lateFee} onChange={e => set('lateFee', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Live preview */}
          <Card>
            <CardHeader><CardTitle className="text-base">Loan Summary Preview</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Amount</span>
                <span className="font-medium">{formatCurrency(loanAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest ({interestRate}%)</span>
                <span className="font-medium">{formatCurrency(interestAmount)}</span>
              </div>
              {lateFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Late Fee</span>
                  <span className="font-medium">{formatCurrency(lateFee)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Repayment</span>
                <span className="text-lg font-bold text-amber-600">{formatCurrency(totalRepayment)}</span>
              </div>
              {termMonths > 0 && (
                <p className="text-xs text-muted-foreground pt-1">Over {termMonths} month{termMonths !== 1 ? 's' : ''}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Button type="submit" size="lg" disabled={!form.customerId}>
          Submit for Approval
        </Button>
      </form>

      {showModal && pendingLoan && selectedCustomer && (
        <ApprovalModal
          open={showModal}
          loan={{ ...pendingLoan, id: '', createdAt: '' }}
          customer={selectedCustomer}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
