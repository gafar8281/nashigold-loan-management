export type LoanStatus = 'Approved' | 'Active' | 'Closed' | 'Overdue'

export interface Customer {
  id: string
  fullName: string
  idNumber: string
  idCopyNumber?: string
  dateOfBirth: string
  mobile: string
  createdAt: string
}

export interface Loan {
  id: string
  customerId: string
  branchId: string | null   // owning branch; null = unassigned/legacy (admin-only)
  periodFrom: string
  periodTo: string
  termMonths: number
  loanAmount: number
  goldWeight: number
  physicalBillNumber: string
  interestRate: number
  lateFeePerMonth: number
  amountPaid: number
  interestAmount: number
  totalRepayment: number
  remainingBalance: number
  status: LoanStatus
  createdAt: string
}

export type UserRole = 'admin' | 'branch'

/** App-level user, mirrors the Firestore `users/{uid}` document. */
export interface AppUser {
  uid: string
  username: string
  email: string
  role: UserRole
  branchId: string | null    // null for admin
  branchName: string | null  // denormalized for display
  isActive: boolean
}

/** Firestore `branches/{branchId}` document. */
export interface Branch {
  id: string
  branchName: string
  branchEmail: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
