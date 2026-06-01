/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react'
import type { Customer, Loan } from '@/types'
import { initialCustomers } from '@/data/customers'
import { initialLoans } from '@/data/loans'
import { resolveStatus } from '@/lib/calculations'
import { nextCustomerId, nextLoanId } from '@/lib/idGen'
import { todayISO } from '@/lib/formatters'

interface DataContextValue {
  customers: Customer[]
  loans: Loan[]
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'idProofUrl'>) => Customer
  updateCustomer: (id: string, data: Partial<Customer>) => void
  addLoan: (data: Omit<Loan, 'id' | 'createdAt'>) => Loan
  updateLoan: (id: string, data: Partial<Loan>) => void
  getCustomerById: (id: string) => Customer | undefined
  getLoanById: (id: string) => Loan | undefined
  getLoansByCustomerId: (customerId: string) => Loan[]
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [rawLoans, setRawLoans] = useState<Loan[]>(initialLoans)

  const loans: Loan[] = rawLoans.map(l => ({ ...l, status: resolveStatus(l) }))

  function addCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'idProofUrl'>): Customer {
    const newCustomer: Customer = {
      ...data,
      id: nextCustomerId(customers),
      idProofUrl: '/mock/id_placeholder.jpg',
      createdAt: todayISO(),
    }
    setCustomers(prev => [...prev, newCustomer])
    return newCustomer
  }

  function updateCustomer(id: string, data: Partial<Customer>): void {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  }

  function addLoan(data: Omit<Loan, 'id' | 'createdAt'>): Loan {
    const newLoan: Loan = {
      ...data,
      id: nextLoanId(rawLoans),
      createdAt: todayISO(),
    }
    setRawLoans(prev => [...prev, newLoan])
    return newLoan
  }

  function updateLoan(id: string, data: Partial<Loan>): void {
    setRawLoans(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))
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
