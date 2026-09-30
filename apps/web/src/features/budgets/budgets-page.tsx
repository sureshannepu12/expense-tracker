import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  useFindBudgets,
  useRemoveBudget,
  useUpsertBudget,
} from '@/api/generated/budgets/budgets'
import { useFindAllCategories } from '@/api/generated/categories/categories'
import type { BudgetDto, CategoryDto } from '@/api/generated/model'
import { useGetSpendingByCategory } from '@/api/generated/reports/reports'
import { IconAction } from '@/components/icon-action'
import { MonthPicker } from '@/components/month-picker'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { currentMonth, monthBounds } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { AMOUNT_REGEX, formatMoney, fromCents, toCents } from '@/lib/money'
import { invalidateSpendingData } from '@/lib/query-client'
import { BudgetProgress } from './budget-progress'

export function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth)

  const categories = useFindAllCategories()
  const budgets = useFindBudgets({ month })
  // Spending for every category (including ones without a budget yet).
  const spending = useGetSpendingByCategory(monthBounds(month))

  const isPending = categories.isPending || budgets.isPending || spending.isPending
  const budgetByCategory = new Map(budgets.data?.map((b) => [b.categoryId, b]))
  const spentByCategory = new Map(spending.data?.map((s) => [s.categoryId, s.total]))

  const totalBudget = budgets.data?.reduce((sum, b) => sum + b.amount, 0) ?? 0
  const totalSpent = budgets.data?.reduce((sum, b) => sum + b.spent, 0) ?? 0

  return (
    <>
      <PageHeader
        title="Budgets"
        description="Set a monthly limit per category and watch your progress."
        actions={<MonthPicker month={month} onChange={setMonth} />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardDescription>Budgeted categories this month</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {formatMoney(totalSpent)}{' '}
            <span className="text-base font-normal text-muted-foreground">
              of {formatMoney(totalBudget)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetProgress spent={totalSpent} limit={totalBudget} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y">
          {isPending
            ? Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="my-3 h-12" />
              ))
            : categories.data?.map((category) => {
                const budget = budgetByCategory.get(category.id)
                return (
                  <BudgetRow
                    // Re-mount when the month or saved amount changes, so the input resets.
                    key={`${month}-${category.id}-${budget?.amount ?? 'none'}`}
                    month={month}
                    category={category}
                    budget={budget}
                    spent={spentByCategory.get(category.id) ?? 0}
                  />
                )
              })}
        </CardContent>
      </Card>
    </>
  )
}

function BudgetRow({
  month,
  category,
  budget,
  spent,
}: {
  month: string
  category: CategoryDto
  budget?: BudgetDto
  spent: number
}) {
  const [value, setValue] = useState(budget ? fromCents(budget.amount) : '')
  const isValid = AMOUNT_REGEX.test(value) && Number(value) > 0
  const isDirty = value !== (budget ? fromCents(budget.amount) : '')

  const onSuccess = async (message: string) => {
    await invalidateSpendingData()
    toast.success(message)
  }
  const onError = (error: unknown) => toast.error(getErrorMessage(error))

  const upsertBudget = useUpsertBudget({
    mutation: { onSuccess: () => onSuccess(`${category.name} budget saved`), onError },
  })
  const removeBudget = useRemoveBudget({
    mutation: { onSuccess: () => onSuccess(`${category.name} budget removed`), onError },
  })

  const save = () => {
    if (!isValid) return
    upsertBudget.mutate({
      data: { categoryId: category.id, month, amount: toCents(value) },
    })
  }

  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[1fr_16rem] sm:items-center">
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-medium">
            {category.icon} {category.name}
          </p>
          <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {formatMoney(spent)}
            {budget && ` of ${formatMoney(budget.amount)}`}
          </p>
        </div>
        {budget ? (
          <BudgetProgress spent={spent} limit={budget.amount} className="mt-2" />
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">No budget set</p>
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Input
          inputMode="decimal"
          placeholder="Set a limit"
          aria-label={`${category.name} budget`}
          aria-invalid={value !== '' && !isValid}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!isDirty || !isValid || upsertBudget.isPending}
          aria-label={`Save ${category.name} budget`}
        >
          <Check />
        </Button>
        <IconAction
          tone="danger"
          size="icon"
          label={`Remove ${category.name} budget`}
          disabled={!budget || removeBudget.isPending}
          onClick={() => budget && removeBudget.mutate({ id: budget.id })}
        >
          <Trash2 />
        </IconAction>
      </form>
    </div>
  )
}
