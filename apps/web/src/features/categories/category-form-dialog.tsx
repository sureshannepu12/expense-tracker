import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  useCreateCategory,
  useUpdateCategory,
} from '@/api/generated/categories/categories'
import type { CategoryDto } from '@/api/generated/model'
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
import { FieldGroup } from '@/components/ui/field'
import { getErrorMessage } from '@/lib/errors'
import { invalidateSpendingData } from '@/lib/query-client'

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(30),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Pick a color'),
  icon: z.string().trim().max(8, 'Keep it to one emoji'),
})
type CategoryValues = z.infer<typeof categorySchema>

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: CategoryDto | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>
            Categories group your expenses on the dashboard.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CategoryForm category={category} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: CategoryDto | null
  onDone: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      color: category?.color ?? '#6366f1',
      icon: category?.icon ?? '',
    },
  })

  const mutationOptions = {
    mutation: {
      onSuccess: async () => {
        await invalidateSpendingData()
        toast.success(category ? 'Category updated' : 'Category created')
        onDone()
      },
      onError: (error: unknown) => toast.error(getErrorMessage(error)),
    },
  }
  const createCategory = useCreateCategory(mutationOptions)
  const updateCategory = useUpdateCategory(mutationOptions)
  const isPending = createCategory.isPending || updateCategory.isPending

  const onSubmit = handleSubmit((values) => {
    // null (not undefined) so clearing the field removes the icon: JSON drops undefined keys.
    const data = { ...values, icon: values.icon || null }
    if (category) updateCategory.mutate({ id: category.id, data })
    else createCategory.mutate({ data })
  })

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <FormInput
          id="name"
          label="Name"
          placeholder="e.g. Groceries"
          autoFocus
          error={errors.name}
          {...register('name')}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            id="color"
            label="Color"
            type="color"
            className="h-9 p-1"
            error={errors.color}
            {...register('color')}
          />
          <FormInput
            id="icon"
            label="Emoji"
            placeholder="🛒"
            error={errors.icon}
            {...register('icon')}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
