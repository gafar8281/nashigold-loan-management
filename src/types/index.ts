export type LoanStatus = 'Pending Approval' | 'Approved' | 'Active' | 'Closed' | 'Overdue'

export interface Customer {
  id: string
  fullName: string
  idNumber: string
  idProofUrl: string
  dateOfBirth: string
  mobile: string
  createdAt: string
}

export interface Loan {
  id: string
  customerId: string
  periodFrom: string
  periodTo: string
  termMonths: number
  loanAmount: number
  goldWeight: number
  interestRate: number
  lateFee: number
  amountPaid: number
  interestAmount: number
  totalRepayment: number
  remainingBalance: number
  status: LoanStatus
  approvalNotes: string
  createdAt: string
}

export interface AuthUser {
  email: string
  branch: string
}
