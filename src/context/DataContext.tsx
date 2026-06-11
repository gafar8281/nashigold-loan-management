/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Customer, Loan } from '@/types'
import { resolveStatus } from '@/lib/calculations'
import { nextCustomerId, nextLoanId } from '@/lib/idGen'
import { todayISO } from '@/lib/formatters'
import { customerService } from '@/services/customerService'
import { loanService } from '@/services/loanService'
import { useAuth } from '@/context/AuthContext'

interface DataContextValue {
  customers: Customer[]
  loans: Loan[]
  loading: boolean
  error: string | null
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>
  addLoan: (data: Omit<Loan, 'id' | 'createdAt' | 'branchId'>) => Promise<Loan>
  updateLoan: (id: string, data: Partial<Loan>) => Promise<void>
  getCustomerById: (id: string) => Customer | undefined
  getLoanById: (id: string) => Loan | undefined
  getLoansByCustomerId: (customerId: string) => Loan[]
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rawLoans, setRawLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Live, derived view: overdue is computed on read, never stored. `allLoans`
  // is the full, unscoped set used for per-customer / per-id lookups (so a
  // customer's complete loan history stays visible across branches).
  const allLoans: Loan[] = rawLoans.map(l => ({ ...l, status: resolveStatus(l) }))

  // Branch-scoped view exposed to the operational pages (Loans, Dashboard,
  // Reports): admins see everything, branch users only their own branch.
  const loans: Loan[] = isAdmin
    ? allLoans
    : allLoans.filter(l => (l.branchId ?? null) === user?.branchId)

  // Latest synced arrays, read inside async mutators for id generation without
  // re-subscribing on every change. Kept current in the snapshot callbacks below.
  const customersRef = useRef(customers)
  const rawLoansRef = useRef(rawLoans)

  useEffect(() => {
    let cancelled = false
    let customersLoaded = false
    let loansLoaded = false
    let unsubCustomers: (() => void) | undefined
    let unsubLoans: (() => void) | undefined

    function markLoaded() {
      if (customersLoaded && loansLoaded && !cancelled) setLoading(false)
    }

    function handleError(err: Error) {
      if (cancelled) return
      setError(err.message || 'Failed to load data from Firestore.')
      setLoading(false)
    }

    async function init() {
      unsubCustomers = customerService.subscribe(items => {
        if (cancelled) return
        customersRef.current = items
        setCustomers(items)
        customersLoaded = true
        markLoaded()
      }, handleError)

      unsubLoans = loanService.subscribe(items => {
        if (cancelled) return
        rawLoansRef.current = items
        setRawLoans(items)
        loansLoaded = true
        markLoaded()
      }, handleError)
    }

    init()

    return () => {
      cancelled = true
      unsubCustomers?.()
      unsubLoans?.()
    }
  }, [])

  async function addCustomer(
    data: Omit<Customer, 'id' | 'createdAt'>,
  ): Promise<Customer> {
    const dupId     = customersRef.current.find(c => c.idNumber === data.idNumber)
    const dupMobile = customersRef.current.find(c => c.mobile   === data.mobile)

    if (dupId && dupMobile) {
      throw new Error('يوجد بالفعل عميل يحمل رقم الهوية ورقم الهاتف المحمول هذا')
    }
    if (dupId) {
      throw new Error('يوجد بالفعل عميل يحمل رقم التعريف هذا')
    }
    if (dupMobile) {
      throw new Error('يوجد بالفعل عميل يحمل رقم الهاتف المحمول هذا')
    }

    const newCustomer: Customer = {
      ...data,
      id: nextCustomerId(customersRef.current),
      createdAt: todayISO(),
    }
    await customerService.setDoc(newCustomer.id, newCustomer)
    return newCustomer
  }

  async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
    await customerService.update(id, data)
  }

  async function addLoan(
    data: Omit<Loan, 'id' | 'createdAt' | 'branchId'>,
  ): Promise<Loan> {
    const newLoan: Loan = {
      ...data,
      id: nextLoanId(rawLoansRef.current),
      // Stamp the creating user's branch (admin → null = admin-only).
      branchId: user?.branchId ?? null,
      createdAt: todayISO(),
    }
    await loanService.setDoc(newLoan.id, newLoan)
    return newLoan
  }

  async function updateLoan(id: string, data: Partial<Loan>): Promise<void> {
    await loanService.update(id, data)
  }

  function getCustomerById(id: string): Customer | undefined {
    return customers.find(c => c.id === id)
  }

  // The two lookups below intentionally use the UNSCOPED `allLoans`: a
  // customer's full loan history must stay visible regardless of branch, and
  // loans opened from that history must resolve for branch users too.
  function getLoanById(id: string): Loan | undefined {
    return allLoans.find(l => l.id === id)
  }

  function getLoansByCustomerId(customerId: string): Loan[] {
    return allLoans.filter(l => l.customerId === customerId)
  }

  return (
    <DataContext.Provider value={{
      customers,
      loans,
      loading,
      error,
      addCustomer,
      updateCustomer,
      addLoan,
      updateLoan,
      getCustomerById,
      getLoanById,
      getLoansByCustomerId,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
