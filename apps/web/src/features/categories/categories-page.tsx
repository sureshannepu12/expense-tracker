import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  useFindAllCategories,
  useRemoveCategory,
} from '@/api/generated/categories/categories'
import type { CategoryDto } from '@/api/generated/model'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { IconAction } from '@/components/icon-action'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/errors'
import { invalidateSpendingData } from '@/lib/query-client'
import { CategoryFormDialog } from './category-form-dialog'

export function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryDto | null>(null)
  const { data: categories, isPending } = useFindAllCategories()

  const removeCategory = useRemoveCategory({
    mutation: {
      onSuccess: async () => {
        await invalidateSpendingData()
        toast.success('Category deleted')
      },
      // The API answers 409 when the category still has expenses; show its message.
      onError: (error) => toast.error(getErrorMessage(error)),
    },
  })

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (category: CategoryDto) => {
    setEditing(category)
    setDialogOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise expenses the way you think about them."
        actions={
          <Button className="flex-1 sm:flex-none" onClick={openCreate}>
            <Plus /> New category
          </Button>
        }
      />

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !categories?.length ? (
        <Card>
          <EmptyState
            icon={Tags}
            title="No categories"
            description="Create one to start adding expenses."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="py-0 transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{ backgroundColor: `${category.color}26` }}
                  aria-hidden
                >
                  {category.icon ?? '•'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {category.expenseCount}{' '}
                    {category.expenseCount === 1 ? 'expense' : 'expenses'}
                  </p>
                </div>
                <IconAction label={`Edit ${category.name}`} onClick={() => openEdit(category)}>
                  <Pencil />
                </IconAction>
                <ConfirmDialog
                  title={`Delete "${category.name}"?`}
                  description={
                    category.expenseCount > 0
                      ? `This category has ${category.expenseCount} expenses, so it can't be deleted until they are moved or removed.`
                      : 'This category will be permanently removed.'
                  }
                  onConfirm={() => removeCategory.mutate({ id: category.id })}
                  trigger={
                    <IconAction tone="danger" label={`Delete ${category.name}`}>
                      <Trash2 />
                    </IconAction>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
      />
    </>
  )
}
