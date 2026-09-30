import { Crown, PieChart, PiggyBank, Receipt, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useFindBudgets } from '@/api/generated/budgets/budgets'
import { useFindAllExpenses } from '@/api/generated/expenses/expenses'
import {
  useGetMonthlyTrend,
  useGetSpendingByCategory,
  useGetSummary,
} from '@/api/generated/reports/reports'
import { CategoryBadge } from '@/components/category-badge'
import { EmptyState } from '@/components/empty-state'
import { MonthPicker } from '@/components/month-picker'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BudgetProgress } from '@/features/budgets/budget-progress'
import { useAuthStore } from '@/lib/auth-store'
import { currentMonth, formatDate, formatMonth, monthBounds, shiftMonth } from '@/lib/dates'
import { formatMoney } from '@/lib/money'
import { CategoryBreakdown } from './category-breakdown'
import { MonthlyTrendChart } from './monthly-trend-chart'
import { StatTile, TrendChip } from './stat-tile'

const TREND_MONTHS = 6

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [month, setMonth] = useState(currentMonth)
  const bounds = monthBounds(month)

  // Each hook is an independent, cached request; they all load in parallel.
  const summary = useGetSummary({ month })
  // endMonth comes from the browser's calendar, so the chart always ends on the month being viewed.
  const trend = useGetMonthlyTrend({ months: TREND_MONTHS, endMonth: month })
  const byCategory = useGetSpendingByCategory(bounds)
  const budgets = useFindBudgets({ month })
  const recent = useFindAllExpenses({ ...bounds, pageSize: 5 })

  const s = summary.data
  const change =
    s && s.previousMonthTotal > 0
      ? ((s.total - s.previousMonthTotal) / s.previousMonthTotal) * 100
      : null
  const budgetSpent = budgets.data?.reduce((sum, b) => sum + b.spent, 0) ?? 0
  const budgetLimit = budgets.data?.reduce((sum, b) => sum + b.amount, 0) ?? 0

  return (
    <>
      <PageHeader
        title={`Hi, ${user?.name.split(' ')[0] ?? 'there'}`}
        description={`Here's your spending for ${formatMonth(month)}.`}
        actions={<MonthPicker month={month} onChange={setMonth} />}
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatTile
          label="Total spent"
          icon={Wallet}
          loading={summary.isPending}
          value={s && formatMoney(s.total)}
          detail={
            change === null ? (
              `No spending in ${formatMonth(shiftMonth(month, -1))}`
            ) : (
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <TrendChip change={change} />
                <span className="max-sm:hidden">vs last month</span>
              </span>
            )
          }
        />
        <StatTile
          label="Transactions"
          icon={Receipt}
          loading={summary.isPending}
          value={s?.count}
          detail={s && s.count > 0 && `Avg ${formatMoney(Math.round(s.total / s.count))} each`}
        />
        <StatTile
          label="Top category"
          icon={Crown}
          loading={summary.isPending}
          value={
            s?.topCategory ? `${s.topCategory.icon ?? ''} ${s.topCategory.name}` : '—'
          }
          detail={s?.topCategory && formatMoney(s.topCategory.total)}
        />
        <StatTile
          label="Budget used"
          icon={PiggyBank}
          loading={budgets.isPending}
          value={
            budgetLimit > 0 ? `${Math.round((budgetSpent / budgetLimit) * 100)}%` : '—'
          }
          detail={
            budgetLimit > 0 ? (
              <div className="space-y-1.5">
                <BudgetProgress spent={budgetSpent} limit={budgetLimit} />
                <span>
                  {formatMoney(budgetSpent)} of {formatMoney(budgetLimit)}
                </span>
              </div>
            ) : (
              <Link to="/budgets" className="font-medium text-primary underline-offset-4 hover:underline">
                Set a budget
              </Link>
            )
          }
        />
      </div>

      <div className="mb-6 grid gap-4 md:gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly spending</CardTitle>
            <CardDescription>Last {TREND_MONTHS} months</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <MonthlyTrendChart data={trend.data ?? []} selectedMonth={month} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Where it went</CardTitle>
            <CardDescription>By category, {formatMonth(month)}</CardDescription>
          </CardHeader>
          <CardContent>
            {byCategory.isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : byCategory.data?.length ? (
              <CategoryBreakdown data={byCategory.data} />
            ) : (
              <EmptyState icon={PieChart} title="Nothing spent this month" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/budgets">Manage</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgets.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : budgets.data?.length ? (
              budgets.data.map((budget) => (
                <div key={budget.id}>
                  <div className="mb-1.5 flex justify-between gap-2 text-sm">
                    <span>
                      {budget.category.icon} {budget.category.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {budget.remaining < 0 ? (
                        <span className="font-medium text-destructive">
                          Over by {formatMoney(-budget.remaining)}
                        </span>
                      ) : (
                        `${formatMoney(budget.remaining)} left`
                      )}
                    </span>
                  </div>
                  <BudgetProgress spent={budget.spent} limit={budget.amount} />
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No budgets for {formatMonth(month)}.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent expenses</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/expenses?from=${bounds.from}&to=${bounds.to}`}>View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recent.isPending ? (
              <Skeleton className="h-32 w-full" />
            ) : recent.data?.data.length ? (
              <ul className="divide-y">
                {recent.data.data.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{expense.description}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(expense.date)}
                        <CategoryBadge category={expense.category} />
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatMoney(expense.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Receipt} title="No expenses this month" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
