import { BarChart3, PiggyBank, ShieldCheck, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

const HIGHLIGHTS = [
  { icon: BarChart3, text: 'See where every rupee goes with monthly trends' },
  { icon: PiggyBank, text: 'Set category budgets and get warned before you overspend' },
  { icon: ShieldCheck, text: 'Your data stays private to your account' },
]

/** Split screen: brand panel on the left (desktop only), form on the right. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
        {/* Soft decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-black/10" />

        <Logo inverted />
        <div className="relative mt-auto max-w-md space-y-8">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            Know where your money goes.
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-auto text-sm text-primary-foreground/70">
          Built with React, NestJS, Prisma &amp; PostgreSQL
        </p>
      </aside>

      <main className="flex min-w-0 flex-col bg-background px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">{description}</p>
          {children}
          <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  )
}

function Logo({ inverted, className }: { inverted?: boolean; className?: string }) {
  return (
    <div className={`relative flex items-center gap-2 text-lg font-semibold ${className ?? ''}`}>
      <span
        className={
          inverted
            ? 'flex size-9 items-center justify-center rounded-lg bg-white/15'
            : 'flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground'
        }
      >
        <Wallet className="size-5" />
      </span>
      Expense Tracker
    </div>
  )
}
