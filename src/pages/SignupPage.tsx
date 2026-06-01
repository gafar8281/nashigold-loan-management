import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [branch, setBranch] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    signup(email, branch, password)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold">Nashi Gold Loans</p>
            <p className="text-xs text-muted-foreground">Branch Management System</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Register to access the branch system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@branch.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="branch">Branch Name</Label>
                <Input
                  id="branch"
                  type="text"
                  placeholder="e.g. Riyadh Main Branch"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Create Account</Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
