import type { Customer, Loan } from '@/types'

export function nextCustomerId(customers: Customer[]): string {
  if (customers.length === 0) return 'CUST-0001'
  const nums = customers.map(c => parseInt(c.id.replace('CUST-', ''), 10))
  const next = Math.max(...nums) + 1
  return 'CUST-' + String(next).padStart(4, '0')
}

export function nextLoanId(loans: Loan[]): string {
  if (loans.length === 0) return 'LOAN-0001'
  const nums = loans.map(l => parseInt(l.id.replace('LOAN-', ''), 10))
  const next = Math.max(...nums) + 1
  return 'LOAN-' + String(next).padStart(4, '0')
}
