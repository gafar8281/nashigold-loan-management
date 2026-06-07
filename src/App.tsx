import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AdminRoute from '@/components/layout/AdminRoute'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CustomersPage from '@/pages/CustomersPage'
import CustomerDetailPage from '@/pages/CustomerDetailPage'
import LoansPage from '@/pages/LoansPage'
import NewLoanPage from '@/pages/NewLoanPage'
import LoanDetailPage from '@/pages/LoanDetailPage'
import ReportsPage from '@/pages/ReportsPage'
import BranchesPage from '@/pages/BranchesPage'
import BranchDetailPage from '@/pages/BranchDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <DataProvider>
                  <AppLayout />
                </DataProvider>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/:id" element={<CustomerDetailPage />} />
              <Route path="/loans" element={<LoansPage />} />
              <Route path="/loans/new" element={<NewLoanPage />} />
              <Route path="/loans/:id" element={<LoanDetailPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/branches" element={<BranchesPage />} />
                <Route path="/branches/:id" element={<BranchDetailPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
