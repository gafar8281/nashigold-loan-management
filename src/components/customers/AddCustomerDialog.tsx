import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const [form, setForm] = useState({
    fullName: '',
    idNumber: '',
    idCopyNumber: '',
    dateOfBirth: '',
    mobile: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    setForm({ fullName: '', idNumber: '', idCopyNumber: '', dateOfBirth: '', mobile: '' })
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await addCustomer({
        fullName: form.fullName,
        idNumber: form.idNumber,
        idCopyNumber: form.idCopyNumber,
        dateOfBirth: form.dateOfBirth,
        mobile: form.mobile,
      })
      setForm({ fullName: '', idNumber: '', idCopyNumber: '', dateOfBirth: '', mobile: '' })
      onClose()
    } catch (err) {
      setError((err as Error).message || 'Failed to save customer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('customers.addNew')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t('table.fullName')}</Label>
            <Input id="fullName" value={form.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="Ahmed Al-Farsi" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idNumber">{t('table.idNumber')}</Label>
            <Input id="idNumber" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} required placeholder="1023456789" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idCopyNumber">{t('table.idCopyNumber')}</Label>
            <Input id="idCopyNumber" value={form.idCopyNumber} onChange={e => set('idCopyNumber', e.target.value)} required placeholder="C-123456" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dob">{t('table.dob')}</Label>
            <Input id="dob" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">{t('table.mobile')}</Label>
            <Input id="mobile" value={form.mobile} onChange={e => set('mobile', e.target.value)} required placeholder="966501234567" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('common.saving') : t('customers.addCustomer')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
