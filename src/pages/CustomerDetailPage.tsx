import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/formatters'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getCustomerById, updateCustomer, getLoansByCustomerId } = useData()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const customer = getCustomerById(id!)
  const loans = getLoansByCustomerId(id!)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', mobile: '', dateOfBirth: '' })

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t('customers.notFound')}</p>
        <Button variant="link" className="ps-0 mt-2" onClick={() => navigate('/customers')}>
          {t('customers.backToCustomers')}
        </Button>
      </div>
    )
  }

  function openEdit() {
    setEditForm({ fullName: customer!.fullName, mobile: customer!.mobile, dateOfBirth: customer!.dateOfBirth })
    setEditOpen(true)
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    updateCustomer(customer!.id, editForm)
    setEditOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" />
          {t('customers.title')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customer.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5 me-1.5" />
            {t('common.edit')}
          </Button>
          <Button size="sm" asChild>
            <Link to={`/loans/new?customerId=${customer.id}`}>
              <Plus className="h-3.5 w-3.5 me-1.5" />
              {t('loans.newLoan')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('customers.profile')}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('table.fullName')}</p>
            <p className="text-sm font-medium mt-0.5">{customer.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('table.idNumber')}</p>
            <p className="text-sm font-medium mt-0.5">{customer.idNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('table.dob')}</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(customer.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('table.mobile')}</p>
            <p className="text-sm font-medium mt-0.5">{customer.mobile}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('customers.customerSince')}</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(customer.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Loan history */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('customers.loanHistory', { count: loans.length })}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.loanId')}</TableHead>
                <TableHead>{t('table.amount')}</TableHead>
                <TableHead>{t('table.period')}</TableHead>
                <TableHead>{t('table.term')}</TableHead>
                <TableHead>{t('table.remaining')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t('customers.noLoans')}</TableCell>
                </TableRow>
              ) : (
                loans.map(loan => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <Link to={`/loans/${loan.id}`} className="font-medium text-amber-600 hover:underline">{loan.id}</Link>
                    </TableCell>
                    <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(loan.periodFrom)} – {formatDate(loan.periodTo)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{loan.termMonths}{t('common.month')[0]}</TableCell>
                    <TableCell>{formatCurrency(loan.remainingBalance)}</TableCell>
                    <TableCell><StatusBadge status={loan.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={v => !v && setEditOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{t('customers.editCustomer')}</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t('table.fullName')}</Label>
              <Input value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t('table.mobile')}</Label>
              <Input value={editForm.mobile} onChange={e => setEditForm(p => ({ ...p, mobile: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t('table.dob')}</Label>
              <Input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm(p => ({ ...p, dateOfBirth: e.target.value }))} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.saveChanges')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
