import { keepPreviousData } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useFindAllCategories } from '@/api/generated/categories/categories'
import {
  useFindAllExpenses,
  useRemoveExpense,
} from '@/api/generated/expenses/expenses'
import type { ExpenseDto, ExpenseSortField } from '@/api/generated/model'
import { CategoryBadge } from '@/components/category-badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { IconAction } from '@/components/icon-action'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { formatMoney } from '@/lib/money'
import { invalidateSpendingData } from '@/lib/query-client'
import { ExpenseFilters } from './expense-filters'
import { ExpenseFormDialog } from './expense-form-dialog'
import { PAGE_SIZES, useExpenseFilters } from './use-expense-filters'

export function ExpensesPage() {
  const filters = useExpenseFilters()
  const { params, setFilters, hasFilters } = filters
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseDto | null>(null)

  const { data: categories = [] } = useFindAllCategories()
  // keepPreviousData shows the current page while the next one loads, so the table doesn't flash.
  const { data, isPending, isError, isPlaceholderData } = useFindAllExpenses(params, {
    query: { placeholderData: keepPreviousData },
  })

  const removeExpense = useRemoveExpense({
    mutation: {
      onSuccess: async () => {
        await invalidateSpendingData()
        toast.success('Expense deleted')
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  })

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (expense: ExpenseDto) => {
    setEditing(expense)
    setDialogOpen(true)
  }

  const toggleSort = (field: ExpenseSortField) => {
    const sameField = params.sortBy === field
    setFilters({
      sortBy: field,
      sortOrder: sameField && params.sortOrder === 'desc' ? 'asc' : 'desc',
    })
  }

  const meta = data?.meta

  // Deleting the last row on the last page (or a stale URL) can leave us past the end:
  // jump back to the last page that exists instead of showing an empty table.
  useEffect(() => {
    if (meta && !isPlaceholderData && meta.page > meta.totalPages) {
      setFilters({ page: meta.totalPages })
    }
  }, [meta, isPlaceholderData, setFilters])
  const firstRow = meta ? (meta.page - 1) * meta.pageSize + 1 : 0
  const lastRow = meta ? Math.min(meta.page * meta.pageSize, meta.total) : 0

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Every rupee you've spent, searchable and sortable."
        actions={
          <Button className="flex-1 sm:flex-none" onClick={openCreate}>
            <Plus /> Add expense
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <ExpenseFilters {...filters} categories={categories} />
        </CardHeader>
        <CardContent className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
          {isPending ? (
            <TableSkeleton />
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive">
              Could not load expenses.
            </p>
          ) : data.data.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={hasFilters ? 'No matching expenses' : 'No expenses yet'}
              description={
                hasFilters
                  ? 'Try changing or clearing the filters.'
                  : 'Add your first expense to start tracking.'
              }
              action={
                !hasFilters && (
                  <Button onClick={openCreate}>
                    <Plus /> Add expense
                  </Button>
                )
              }
            />
          ) : (
            <>
            {/* Phones: a tappable list (tap a row to edit). The table needs more width than a phone has. */}
            <div className="md:hidden">
              <MobileSortSelect params={params} setFilters={setFilters} />
              <MobileExpenseList expenses={data.data} onSelect={openEdit} />
            </div>
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead
                    label="Date"
                    field="date"
                    params={params}
                    onSort={toggleSort}
                  />
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <SortableHead
                    label="Amount"
                    field="amount"
                    params={params}
                    onSort={toggleSort}
                    className="text-right"
                  />
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((expense) => (
                  <TableRow key={expense.id} className="group">
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <CategoryBadge category={expense.category} />
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatMoney(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <IconAction
                          label={`Edit ${expense.description}`}
                          onClick={() => openEdit(expense)}
                        >
                          <Pencil />
                        </IconAction>
                        <ConfirmDialog
                          title="Delete this expense?"
                          description={`"${expense.description}" (${formatMoney(expense.amount)}) will be permanently removed.`}
                          onConfirm={() => removeExpense.mutate({ id: expense.id })}
                          trigger={
                            <IconAction
                              tone="danger"
                              label={`Delete ${expense.description}`}
                            >
                              <Trash2 />
                            </IconAction>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          )}
        </CardContent>

        {meta && meta.total > 0 && (
          <CardFooter className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              Showing {firstRow}–{lastRow} of {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={String(meta.pageSize)}
                onValueChange={(value) => setFilters({ pageSize: value })}
              >
                <SelectTrigger size="sm" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={meta.page <= 1}
                onClick={() => setFilters({ page: meta.page - 1 })}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>
              <span className="tabular-nums">
                {meta.page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilters({ page: meta.page + 1 })}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editing}
      />
    </>
  )
}

function SortableHead({
  label,
  field,
  params,
  onSort,
  className,
}: {
  label: string
  field: ExpenseSortField
  params: { sortBy?: ExpenseSortField; sortOrder?: string }
  onSort: (field: ExpenseSortField) => void
  className?: string
}) {
  const active = params.sortBy === field
  const Icon = params.sortOrder === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {active && <Icon className="size-3.5" />}
      </button>
    </TableHead>
  )
}

const MOBILE_SORTS = {
  'date-desc': 'Newest first',
  'date-asc': 'Oldest first',
  'amount-desc': 'Highest amount',
  'amount-asc': 'Lowest amount',
} as const

/** Phones have no column headers to click, so sorting is a single dropdown. */
function MobileSortSelect({
  params,
  setFilters,
}: Pick<ReturnType<typeof useExpenseFilters>, 'params' | 'setFilters'>) {
  const value = `${params.sortBy}-${params.sortOrder}`
  return (
    <div className="mb-2 flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>Sort by</span>
      <Select
        value={value in MOBILE_SORTS ? value : 'date-desc'}
        onValueChange={(v) => {
          const [sortBy, sortOrder] = v.split('-')
          setFilters({ sortBy, sortOrder })
        }}
      >
        <SelectTrigger size="sm" aria-label="Sort expenses">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {Object.entries(MOBILE_SORTS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function MobileExpenseList({
  expenses,
  onSelect,
}: {
  expenses: ExpenseDto[]
  onSelect: (expense: ExpenseDto) => void
}) {
  return (
    <ul className="-mx-4 divide-y border-y">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <button
            type="button"
            onClick={() => onSelect(expense)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-lg"
              style={{ backgroundColor: `${expense.category.color}26` }}
              aria-hidden
            >
              {expense.category.icon ?? '•'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{expense.description}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {formatDate(expense.date)} · {expense.category.name}
              </span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatMoney(expense.amount)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}
