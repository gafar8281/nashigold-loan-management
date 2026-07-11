export type LoanStatus = 'Approved' | 'Active' | 'Closed' | 'Overdue'

export type InterestType = 'percentage' | 'fixed'

export type DiscountType = 'percentage' | 'fixed'

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
  branchId: string | null   // owning branch; null = unassigned/legacy (admin-onlyy)
  periodFrom: string
  periodTo: string
  termMonths: number
  loanAmount: number
  goldWeight: number
  physicalBillNumber: string
  interestRate: number
  interestType?: InterestType
  lateFeePerMonth: number   // flat one-time late fee applied once overdue (field name kept for existing data compatibility, no longer multiplied by months overdue)
  discount?: number
  discountType?: DiscountType
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

/** Firestore `settings/ledger-{branchId}` document — one per branch. */
export interface LedgerSettings {
  id: string
  branchId: string
  openingBalance: number
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
