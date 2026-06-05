import { useState } from 'react'
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
    setSaving(true)
    setError(null)
    try {
      await createBranch(form)
      reset()
      onClose()
    } catch (err) {
      const code = (err as { code?: string }).code
      setError(
        code === 'auth/email-already-in-use'
          ? 'That email is already in use by another account.'
          : code === 'auth/weak-password'
            ? 'Password must be at least 6 characters.'
            : code === 'auth/invalid-email'
              ? 'Please enter a valid email address.'
              : (err as Error).message || 'Failed to create branch.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Branch</DialogTitle>
          <DialogDescription>
            This creates the branch and its login credentials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="branchName">Branch Name</Label>
            <Input
              id="branchName"
              value={form.branchName}
              onChange={e => set('branchName', e.target.value)}
              required
              placeholder="Riyadh Main Branch"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branchEmail">Branch Email (login)</Label>
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
            <Label htmlFor="branchPassword">Password</Label>
            <Input
              id="branchPassword"
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              placeholder="At least 6 characters"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
