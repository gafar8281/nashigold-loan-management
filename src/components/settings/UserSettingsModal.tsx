import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userService } from '@/services/userService'
import { useAuth } from '@/context/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  onClose: () => void
}

function UserSettingsForm({ onClose }: Props) {
  const { user, isAdmin } = useAuth()
  const { t } = useTranslation()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!newPassword) next.newPassword = t('settings.errors.required')
    else if (newPassword.length < 6) next.newPassword = t('settings.errors.tooShort')
    if (newPassword !== confirmPassword) next.confirmPassword = t('settings.errors.mismatch')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    if (!user?.uid) {
      setErrors({ newPassword: t('settings.errors.sessionExpired') })
      return
    }
    setSaving(true)
    try {
      await userService.update(user.uid, { password: newPassword })
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch {
      setErrors({ newPassword: t('settings.errors.updateFailed') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 py-2">
      {success && (
        <p className="text-sm font-medium text-green-600">{t('settings.successMsg')}</p>
      )}

      <div className="space-y-1">
        <Label>{t('settings.email')}</Label>
        <Input value={user?.email ?? ''} disabled readOnly />
      </div>

      <div className="space-y-1">
        <Label>{isAdmin ? t('settings.role') : t('settings.branch')}</Label>
        <Input value={isAdmin ? t('auth.administrator') : user?.branchName ?? ''} disabled readOnly />
      </div>

      {isAdmin && (
        <div className="space-y-1">
          <Label>{t('settings.branchName')}</Label>
          <Input value={user?.branchName ?? ''} disabled readOnly />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="settings-password">{t('settings.newPassword')}</Label>
        <Input
          id="settings-password"
          type="password"
          placeholder={t('settings.newPasswordPlaceholder')}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={success || saving}
        />
        {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="settings-confirm">{t('settings.confirmPassword')}</Label>
        <Input
          id="settings-confirm"
          type="password"
          placeholder={t('settings.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={success || saving}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={success || saving}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={success || saving}>
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </DialogFooter>
    </div>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
}

export default function UserSettingsModal({ open, onClose }: ModalProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>
        {open && <UserSettingsForm onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
