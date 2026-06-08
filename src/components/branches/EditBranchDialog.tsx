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
  DialogFooter,
} from '@/components/ui/dialog'
import { updateBranch } from '@/services/branchAdmin'
import type { Branch } from '@/types'

interface Props {
  branch: Branch | null
  onClose: () => void
}

export default function EditBranchDialog({ branch, onClose }: Props) {
  const { t } = useTranslation()
  const [branchName, setBranchName] = useState(branch?.branchName ?? '')
  const [branchEmail, setBranchEmail] = useState(branch?.branchEmail ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!branch) return
    setSaving(true)
    setError(null)
    try {
      await updateBranch(branch.id, { branchName, branchEmail })
      onClose()
    } catch (err) {
      setError((err as Error).message || t('branches.errors.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!branch} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('branches.editTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="editBranchName">{t('branches.branchName')}</Label>
            <Input
              id="editBranchName"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editBranchEmail">{t('branches.email')}</Label>
            <Input
              id="editBranchEmail"
              type="email"
              value={branchEmail}
              onChange={e => setBranchEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('branches.branchEmailNote')}
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.saving') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
