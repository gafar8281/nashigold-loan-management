import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Landmark, BarChart3, LogOut, Coins } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customers', label: 'Customers', icon: Users, end: false },
  { to: '/loans', label: 'Loans', icon: Landmark, end: false },
  { to: '/reports', label: 'Reports', icon: BarChart3, end: false },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r bg-card">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-sm leading-tight">
            Nashi Gold<br />
            <span className="text-xs font-normal text-muted-foreground">Loan Management</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t px-3 py-4">
          <div className="mb-2 px-3">
            <p className="text-xs font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.branch}</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
