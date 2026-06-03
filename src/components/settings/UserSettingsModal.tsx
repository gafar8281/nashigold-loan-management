import { useState } from 'react'
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

// Rendered only when open — remounts on each open so state initialises fresh from user
function UserSettingsForm({ onClose }: Props) {
  const { user, updateUser } = useAuth()

  const [email, setEmail] = useState(user?.email ?? '')
  const [branch, setBranch] = useState(user?.branch ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!email.trim()) next.email = 'Email is required.'
    if (!branch.trim()) next.branch = 'Branch name is required.'
    if (newPassword && newPassword !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSave() {
    if (!validate()) return
    updateUser({ email: email.trim(), branch: branch.trim() })
    setSuccess(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="space-y-4 py-2">
      {success && (
        <p className="text-sm font-medium text-green-600">Settings saved successfully.</p>
      )}

      <div className="space-y-1">
        <Label htmlFor="settings-email">Email</Label>
        <Input
          id="settings-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={success}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="settings-branch">Branch Name</Label>
        <Input
          id="settings-branch"
          type="text"
          value={branch}
          onChange={e => setBranch(e.target.value)}
          disabled={success}
        />
        {errors.branch && <p className="text-xs text-destructive">{errors.branch}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="settings-password">New Password</Label>
        <Input
          id="settings-password"
          type="password"
          placeholder="Leave blank to keep current"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={success}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="settings-confirm">Confirm Password</Label>
        <Input
          id="settings-confirm"
          type="password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={success}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={success}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={success}>
          Save
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
