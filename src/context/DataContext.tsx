/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Customer, Loan } from '@/types'
import { resolveStatus } from '@/lib/calculations'
import { nextCustomerId, nextLoanId } from '@/lib/idGen'
import { todayISO } from '@/lib/formatters'
import { customerService } from '@/services/customerService'
import { loanService } from '@/services/loanService'
import { seedIfEmpty } from '@/lib/seed'

interface DataContextValue {
  customers: Customer[]
  loans: Loan[]
  loading: boolean
  error: string | null
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'idProofUrl'>) => Promise<Customer>
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>
  addLoan: (data: Omit<Loan, 'id' | 'createdAt'>) => Promise<Loan>
  updateLoan: (id: string, data: Partial<Loan>) => Promise<void>
  getCustomerById: (id: string) => Customer | undefined
  getLoanById: (id: string) => Loan | undefined
  getLoansByCustomerId: (customerId: string) => Loan[]
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rawLoans, setRawLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Live, derived view: overdue is computed on read, never stored.
  const loans: Loan[] = rawLoans.map(l => ({ ...l, status: resolveStatus(l) }))

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
      try {
        await seedIfEmpty()
      } catch (err) {
        handleError(err as Error)
        return
      }
      if (cancelled) return

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
    data: Omit<Customer, 'id' | 'createdAt' | 'idProofUrl'>,
  ): Promise<Customer> {
    const newCustomer: Customer = {
      ...data,
      id: nextCustomerId(customersRef.current),
      idProofUrl: '/mock/id_placeholder.jpg',
      createdAt: todayISO(),
    }
    await customerService.setDoc(newCustomer.id, newCustomer)
    return newCustomer
  }

  async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
    await customerService.update(id, data)
  }

  async function addLoan(data: Omit<Loan, 'id' | 'createdAt'>): Promise<Loan> {
    const newLoan: Loan = {
      ...data,
      id: nextLoanId(rawLoansRef.current),
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

  function getLoanById(id: string): Loan | undefined {
    return loans.find(l => l.id === id)
  }

  function getLoansByCustomerId(customerId: string): Loan[] {
    return loans.filter(l => l.customerId === customerId)
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
