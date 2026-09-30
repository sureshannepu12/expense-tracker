import type { CategoryTotalDto } from '@/api/generated/model'
import { formatMoney } from '@/lib/money'

/**
 * Ranked horizontal bars: comparing amounts is a magnitude job, so every bar
 * uses one hue. Each row is labelled with name and value, and the category's own
 * color appears only as a small dot beside the name, never as the bar itself.
 */
export function CategoryBreakdown({ data }: { data: CategoryTotalDto[] }) {
  const total = data.reduce((sum, row) => sum + row.total, 0)
  const max = Math.max(...data.map((row) => row.total), 1)

  return (
    <ul className="space-y-3">
      {data.map((row) => {
        const share = total > 0 ? Math.round((row.total / total) * 100) : 0
        return (
          <li
            key={row.categoryId}
            title={`${row.name}: ${formatMoney(row.total)} · ${share}% · ${row.count} expenses`}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden
                />
                <span className="truncate">
                  {row.icon} {row.name}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMoney(row.total)}
                <span className="ml-2 inline-block w-9 text-right text-xs text-muted-foreground">
                  {share}%
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${(row.total / max) * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
