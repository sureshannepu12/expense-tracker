import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useFindAllCategories } from '@/api/generated/categories/categories'
import { Trash2 } from 'lucide-react'
import {
  useCreateExpense,
  useRemoveExpense,
  useUpdateExpense,
} from '@/api/generated/expenses/expenses'
import type { ExpenseDto } from '@/api/generated/model'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FormInput } from '@/components/form-input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { CategorySelect } from '@/features/categories/category-select'
import { toDateInput, today } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { AMOUNT_REGEX, formatMoney, fromCents, toCents } from '@/lib/money'
import { invalidateSpendingData } from '@/lib/query-client'

// Amount is kept as a string while typing and converted to cents on submit.
const expenseSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(AMOUNT_REGEX, 'Enter an amount like 250 or 99.50')
    .refine((v) => Number(v) > 0, 'Amount must be more than 0'),
  description: z.string().trim().min(1, 'Description is required').max(200),
  date: z.string().min(1, 'Pick a date'),
  categoryId: z.string().min(1, 'Choose a category'),
})
type ExpenseValues = z.infer<typeof expenseSchema>

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass an expense to edit it; leave empty to create a new one. */
  expense?: ExpenseDto | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Add expense'}</DialogTitle>
          <DialogDescription>
            {expense ? 'Update the details below.' : 'Record money you spent.'}
          </DialogDescription>
        </DialogHeader>
        {/* Mounting the form only while open gives it fresh default values each time. */}
        {open && (
          <ExpenseForm expense={expense} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ExpenseForm({
  expense,
  onDone,
}: {
  expense?: ExpenseDto | null
  onDone: () => void
}) {
  const { data: categories = [] } = useFindAllCategories()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense ? fromCents(expense.amount) : '',
      description: expense?.description ?? '',
      date: expense ? toDateInput(expense.date) : today(),
      categoryId: expense?.categoryId ?? '',
    },
  })

  const mutationOptions = {
    mutation: {
      onSuccess: async () => {
        await invalidateSpendingData()
        toast.success(expense ? 'Expense updated' : 'Expense added')
        onDone()
      },
      onError: (error: unknown) => toast.error(getErrorMessage(error)),
    },
  }
  const createExpense = useCreateExpense(mutationOptions)
  const updateExpense = useUpdateExpense(mutationOptions)
  const removeExpense = useRemoveExpense({
    mutation: {
      onSuccess: async () => {
        await invalidateSpendingData()
        toast.success('Expense deleted')
        onDone()
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  })
  const isPending = createExpense.isPending || updateExpense.isPending

  const onSubmit = handleSubmit((values) => {
    const data = { ...values, amount: toCents(values.amount) }
    if (expense) updateExpense.mutate({ id: expense.id, data })
    else createExpense.mutate({ data })
  })

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            id="amount"
            label="Amount"
            inputMode="decimal"
            placeholder="0.00"
            autoFocus
            error={errors.amount}
            {...register('amount')}
          />
          <FormInput
            id="date"
            label="Date"
            type="date"
            error={errors.date}
            {...register('date')}
          />
        </div>
        <FormInput
          id="description"
          label="Description"
          placeholder="e.g. Groceries"
          error={errors.description}
          {...register('description')}
        />
        {/* Radix Select isn't a native input, so it's wired up with Controller instead of register(). */}
        <Controller
          control={control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="categoryId">Category</FieldLabel>
              <CategorySelect
                id="categoryId"
                className="w-full"
                categories={categories}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <DialogFooter>
          {expense && (
            <ConfirmDialog
              title="Delete this expense?"
              description={`"${expense.description}" (${formatMoney(expense.amount)}) will be permanently removed.`}
              onConfirm={() => removeExpense.mutate({ id: expense.id })}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive sm:mr-auto"
                  disabled={removeExpense.isPending}
                >
                  <Trash2 /> Delete
                </Button>
              }
            />
          )}
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
