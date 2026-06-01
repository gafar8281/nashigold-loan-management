import { useState } from 'react'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AddCustomerDialog({ open, onClose }: Props) {
  const { addCustomer } = useData()
  const [form, setForm] = useState({
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
    mobile: '',
    idProofFileName: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addCustomer({
      fullName: form.fullName,
      idNumber: form.idNumber,
      dateOfBirth: form.dateOfBirth,
      mobile: form.mobile,
    })
    setForm({ fullName: '', idNumber: '', dateOfBirth: '', mobile: '', idProofFileName: '' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={form.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="Ahmed Al-Farsi" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idNumber">ID Number</Label>
            <Input id="idNumber" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} required placeholder="1023456789" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">Mobile</Label>
            <Input id="mobile" value={form.mobile} onChange={e => set('mobile', e.target.value)} required placeholder="+966501234567" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idProof">ID Proof (mock filename)</Label>
            <Input id="idProof" value={form.idProofFileName} onChange={e => set('idProofFileName', e.target.value)} placeholder="national_id.jpg" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Add Customer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
