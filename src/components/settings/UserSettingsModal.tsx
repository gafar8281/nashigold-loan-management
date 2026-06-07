import { useState } from 'react'
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

// Rendered only when open — remounts on each open so state initialises fresh.
function UserSettingsForm({ onClose }: Props) {
  const { user, isAdmin } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!newPassword) next.newPassword = 'Enter a new password.'
    else if (newPassword.length < 6) next.newPassword = 'Password must be at least 6 characters.'
    if (newPassword !== confirmPassword) next.confirmPassword = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    if (!user?.uid) {
      setErrors({ newPassword: 'Session expired. Please sign in again.' })
      return
    }
    setSaving(true)
    try {
      await userService.update(user.uid, { password: newPassword })
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch {
      setErrors({ newPassword: 'Could not update password. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 py-2">
      {success && (
        <p className="text-sm font-medium text-green-600">Password updated successfully.</p>
      )}

      <div className="space-y-1">
        <Label>Email</Label>
        <Input value={user?.email ?? ''} disabled readOnly />
      </div>

      <div className="space-y-1">
        <Label>{isAdmin ? 'Role' : 'Branch'}</Label>
        <Input value={isAdmin ? 'Administrator' : user?.branchName ?? ''} disabled readOnly />
      </div>

      {isAdmin && (
        <div className="space-y-1">
          <Label>Branch Name</Label>
          <Input value={user?.branchName ?? ''} disabled readOnly />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="settings-password">New Password</Label>
        <Input
          id="settings-password"
          type="password"
          placeholder="At least 6 characters"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={success || saving}
        />
        {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="settings-confirm">Confirm Password</Label>
        <Input
          id="settings-confirm"
          type="password"
          placeholder="Repeat new password"
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
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={success || saving}>
          {saving ? 'Saving…' : 'Save'}
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
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>
        {open && <UserSettingsForm onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
