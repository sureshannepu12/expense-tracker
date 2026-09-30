import type { CategoryDto } from '@/api/generated/model'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const ALL_CATEGORIES = 'all'

/** Category dropdown. With `allowAll`, adds an "All categories" option (used by filters). */
export function CategorySelect({
  id,
  categories,
  value,
  onChange,
  allowAll = false,
  invalid,
  placeholder = 'Choose a category',
  className,
}: {
  id?: string
  categories: CategoryDto[]
  value: string
  onChange: (value: string) => void
  allowAll?: boolean
  invalid?: boolean
  placeholder?: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-invalid={invalid} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>}
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            {category.icon} {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
