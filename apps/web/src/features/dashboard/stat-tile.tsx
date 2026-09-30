import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** A single headline number with an icon and an optional line of context underneath. */
export function StatTile({
  label,
  icon: Icon,
  value,
  detail,
  loading,
}: {
  label: string
  icon: LucideIcon
  value: ReactNode
  detail?: ReactNode
  loading?: boolean
}) {
  return (
    <Card className="gap-2 max-sm:[--card-spacing:--spacing(3)]">
      <CardHeader>
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          {label}
        </CardTitle>
        <CardAction>
          <span className="flex size-7 items-center justify-center rounded-md bg-accent text-accent-foreground sm:size-8">
            <Icon className="size-4" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <>
            <div className="truncate text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">
              {value}
            </div>
            {detail && <div className="mt-1.5 text-xs text-muted-foreground">{detail}</div>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Month-over-month change. Spending less is good (green), spending more is a warning (amber).
 * Direction is also shown by the arrow and the words, so it never relies on color alone.
 */
export function TrendChip({ change }: { change: number }) {
  const up = change > 0
  return (
    <span
      className={
        up
          ? 'inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400'
          : 'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400'
      }
    >
      {up ? '↑' : '↓'} {Math.abs(change).toFixed(0)}% {up ? 'more' : 'less'}
      <span className="sr-only"> than last month</span>
    </span>
  )
}
