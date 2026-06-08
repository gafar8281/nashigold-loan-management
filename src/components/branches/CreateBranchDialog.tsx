import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { createBranch } from '@/services/branchAdmin'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CreateBranchDialog({ open, onClose }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ branchName: '', branchEmail: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function reset() {
    setForm({ branchName: '', branchEmail: '', password: '' })
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) {
      setError(t('branches.errors.passwordTooShort'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createBranch(form)
      reset()
      onClose()
    } catch (err) {
      setError((err as Error).message || t('branches.errors.createFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('branches.createTitle')}</DialogTitle>
          <DialogDescription>{t('branches.createDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="branchName">{t('branches.branchName')}</Label>
            <Input
              id="branchName"
              value={form.branchName}
              onChange={e => set('branchName', e.target.value)}
              required
              placeholder="Riyadh Main Branch"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branchEmail">{t('branches.branchEmailLabel')}</Label>
            <Input
              id="branchEmail"
              type="email"
              value={form.branchEmail}
              onChange={e => set('branchEmail', e.target.value)}
              required
              placeholder="riyadh@nashigold.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branchPassword">{t('branches.branchPassword')}</Label>
            <Input
              id="branchPassword"
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              placeholder={t('branches.branchPasswordPlaceholder')}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.creating') : t('branches.createTitle')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
