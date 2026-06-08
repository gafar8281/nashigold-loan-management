import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Loader2, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBranches } from '@/hooks/useBranches'
import { setBranchActive } from '@/services/branchAdmin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import EditBranchDialog from '@/components/branches/EditBranchDialog'
import { formatDate } from '@/lib/formatters'

export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { branches, loading } = useBranches()
  const { t } = useTranslation()

  const branch = branches.find(b => b.id === id) ?? null

  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function run(action: () => Promise<void>, successMsg?: string) {
    setBusy(true)
    setNotice(null)
    try {
      await action()
      if (successMsg) setNotice({ type: 'success', message: successMsg })
    } catch (err) {
      setNotice({ type: 'error', message: (err as Error).message || 'Action failed.' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin me-2" />
        {t('branches.loadingShort')}
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t('branches.notFound')}</p>
        <Button variant="link" className="ps-0 mt-2" onClick={() => navigate('/branches')}>
          {t('branches.backToBranches')}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/branches')}>
          <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" />
          {t('branches.title')}
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{branch.branchName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{branch.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} disabled={busy}>
            <Pencil className="h-3.5 w-3.5 me-1.5" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <Alert variant={notice.type === 'error' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}

      {/* Details card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('branches.details')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('branches.branchName')}</p>
            <p className="text-sm font-medium mt-0.5">{branch.branchName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('branches.email')}</p>
            <p className="text-sm font-medium mt-0.5">{branch.branchEmail}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('branches.status')}</p>
            <div className="mt-0.5">
              {branch.isActive ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {t('branches.active')}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                  {t('branches.disabled')}
                </Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('branches.created')}</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(branch.createdAt.slice(0, 10))}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('branches.lastUpdated')}</p>
            <p className="text-sm font-medium mt-0.5">{formatDate(branch.updatedAt.slice(0, 10))}</p>
          </div>
        </CardContent>
      </Card>

      {/* Enable / Disable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('branches.access')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {branch.isActive ? t('branches.isEnabled') : t('branches.isDisabled')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {branch.isActive ? t('branches.enabledDesc') : t('branches.disabledDesc')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="branch-active-switch" className="text-sm text-muted-foreground">
              {branch.isActive ? t('branches.enabledLabel') : t('branches.disabledLabel')}
            </Label>
            <Switch
              id="branch-active-switch"
              checked={branch.isActive}
              disabled={busy}
              onCheckedChange={() => run(() => setBranchActive(branch.id, !branch.isActive))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <EditBranchDialog branch={editing ? branch : null} onClose={() => setEditing(false)} />
    </div>
  )
}
