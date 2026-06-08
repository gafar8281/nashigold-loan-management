import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LanguageToggle from '@/components/layout/LanguageToggle'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const err = await login(email, password)
    setSubmitting(false)
    if (err) {
      setError(err)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      {/* Language toggle top-end */}
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold">{t('auth.appName')}</p>
            <p className="text-xs text-muted-foreground">{t('auth.appSubtitle')}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.signIn')}</CardTitle>
            <CardDescription>{t('auth.signInDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              {error && <p className="text-sm text-destructive">{t(error)}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t('auth.signInBtn')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
