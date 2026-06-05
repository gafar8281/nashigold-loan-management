import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus } from 'lucide-react'
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

  const customer = getCustomerById(id!)
  const loans = getLoansByCustomerId(id!)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', mobile: '', dateOfBirth: '' })

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Customer not found.</p>
        <Button variant="link" className="pl-0 mt-2" onClick={() => navigate('/customers')}>
          Back to customers
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
          <ArrowLeft className="h-4 w-4 mr-1" />
          Customers
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.fullName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customer.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button size="sm" asChild>
            <Link to={`/loans/new?customerId=${customer.id}`}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Loan
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader><CardTitle className="text-base">Customer Profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="text-sm font-medium mt-0.5">{customer.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ID Number</p>
            <p className="text-sm font-medium mt-0.5">{customer.idNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date of Birth</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(customer.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mobile</p>
            <p className="text-sm font-medium mt-0.5">{customer.mobile}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customer Since</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(customer.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Loan history .com*/}
      <Card>
        <CardHeader><CardTitle className="text-base">Loan History ({loans.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No loans found</TableCell>
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
                    <TableCell className="text-muted-foreground">{loan.termMonths}m</TableCell>
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
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input value={editForm.mobile} onChange={e => setEditForm(p => ({ ...p, mobile: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm(p => ({ ...p, dateOfBirth: e.target.value }))} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
