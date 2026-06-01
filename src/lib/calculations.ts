import type { Loan, LoanStatus } from '@/types'

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30

export function calcInterestAmount(loanAmount: number, interestRate: number): number {
  return loanAmount * (interestRate / 100)
}

export function calcTotalRepayment(loanAmount: number, interestAmount: number, lateFee: number): number {
  return loanAmount + interestAmount + lateFee
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
  if (loan.status === 'Pending Approval') return 'Pending Approval'
  if (isOverdue(loan.periodTo, loan.status)) return 'Overdue'
  return loan.status
}

export function calcDaysOverdue(periodTo: string): number {
  const diff = Date.now() - new Date(periodTo).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}
