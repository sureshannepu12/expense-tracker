import {
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Tags,
  Wallet,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/use-logout'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import { IconAction } from './icon-action'
import { ThemeToggle } from './theme-toggle'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
]

export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  return (
    <div className="min-h-svh bg-muted/30 md:grid md:grid-cols-[15rem_1fr]">
      {/* Sidebar (tablet/desktop) */}
      <aside className="sticky top-0 hidden h-svh border-r bg-background md:flex md:flex-col">
        <Brand className="h-16 px-6" />
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        {user && (
          <div className="mt-auto flex items-center gap-3 border-t p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <IconAction label="Log out" onClick={logout}>
              <LogOut />
            </IconAction>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 md:h-16 md:px-8">
            <Brand className="md:hidden" />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={logout}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut />
              </Button>
            </div>
          </div>
        </header>

        {/* Extra bottom padding on mobile so the tab bar never covers content. */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab bar (phones) */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <TabLink key={item.to} {...item} />
        ))}
      </nav>
    </div>
  )
}

/** "Demo User" -> "DU" */
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function Brand({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 font-semibold', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wallet className="size-4" />
      </span>
      Expense Tracker
    </div>
  )
}

type NavItem = (typeof NAV_ITEMS)[number]

function SidebarLink({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          isActive && 'bg-accent text-accent-foreground',
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  )
}

function TabLink({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-1 pt-2 pb-2.5 text-[11px] font-medium text-muted-foreground transition-colors',
          isActive && 'text-primary',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
              isActive && 'bg-accent',
            )}
          >
            <Icon className="size-5" />
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}
