import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

/** Progress bar that turns amber near the limit and red when over it. */
export function BudgetProgress({
  spent,
  limit,
  className,
}: {
  spent: number
  limit: number
  className?: string
}) {
  const percent = limit > 0 ? (spent / limit) * 100 : 0
  return (
    <Progress
      value={Math.min(percent, 100)}
      aria-label={`${Math.round(percent)}% of budget used`}
      className={cn(
        'h-2',
        percent >= 100
          ? '[&>[data-slot=progress-indicator]]:bg-destructive'
          : percent >= 80
            ? '[&>[data-slot=progress-indicator]]:bg-amber-500'
            : '[&>[data-slot=progress-indicator]]:bg-chart-1',
        className,
      )}
    />
  )
}
