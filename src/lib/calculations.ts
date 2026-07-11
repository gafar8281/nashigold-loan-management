import type { DiscountType, InterestType, Loan, LoanStatus } from '@/types'

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30

export function calcInterestAmount(
  loanAmount: number,
  interestRate: number,
  termMonths: number,
  interestType: InterestType = 'percentage',
): number {
  if (interestType === 'fixed') return interestRate * termMonths
  return loanAmount * (interestRate / 100) * termMonths
}

export function calcTotalRepayment(loanAmount: number, interestAmount: number): number {
  return loanAmount + interestAmount
}

export function calcRemainingBalance(totalRepayment: number, amountPaid: number): number {
  return Math.max(0, totalRepayment - amountPaid)
}

export function calcTermMonths(periodFrom: string, periodTo: string): number {
  const from = new Date(periodFrom).getTime()
  const to = new Date(periodTo).getTime()
  return Math.round((to - from) / MS_PER_MONTH)
}

export function isOverdue(periodTo: string, status: LoanStatus): boolean {
  if (status === 'Closed') return false
  return new Date() > new Date(periodTo)
}

export function resolveStatus(loan: Loan): LoanStatus {
  if (loan.status === 'Closed') return 'Closed'
  if ((loan.status as string) === 'Pending Approval') return 'Active'
  if (isOverdue(loan.periodTo, loan.status)) return 'Overdue'
  return loan.status
}

export function calcDaysOverdue(periodTo: string): number {
  const diff = Date.now() - new Date(periodTo).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function calcDiscountAmount(
  totalRepayment: number,
  discount: number,
  discountType: DiscountType = 'percentage',
): number {
  if (discountType === 'fixed') return Math.min(totalRepayment, Math.max(0, discount))
  return totalRepayment * (Math.min(100, Math.max(0, discount)) / 100)
}

export function calcDiscountedRepayment(
  totalRepayment: number,
  discount: number,
  discountType: DiscountType = 'percentage',
): number {
  return totalRepayment - calcDiscountAmount(totalRepayment, discount, discountType)
}

export function calcEffectiveLateFee(
  lateFeePerMonth: number,
  periodTo: string,
  status: LoanStatus,
): number {
  if (!isOverdue(periodTo, status)) return 0
  return lateFeePerMonth ?? 0
}
