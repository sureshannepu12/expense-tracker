import type { CategorySummaryDto } from '@/api/generated/model'

/** Colored dot + emoji + name. */
export function CategoryBadge({ category }: { category: CategorySummaryDto }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: category.color }}
        aria-hidden
      />
      {category.icon && <span aria-hidden>{category.icon}</span>}
      {category.name}
    </span>
  )
}
