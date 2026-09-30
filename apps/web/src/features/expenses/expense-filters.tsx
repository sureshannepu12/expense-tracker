import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CategoryDto, FindAllExpensesParams } from '@/api/generated/model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ALL_CATEGORIES,
  CategorySelect,
} from '@/features/categories/category-select'
import { cn } from '@/lib/utils'
import type { useExpenseFilters } from './use-expense-filters'

type Filters = ReturnType<typeof useExpenseFilters>

export function ExpenseFilters({
  params,
  setFilters,
  clearFilters,
  hasFilters,
  categories,
}: Filters & { params: FindAllExpensesParams; categories: CategoryDto[] }) {
  // The search box keeps its own state so typing feels instant; the URL is updated 300ms after
  // the user stops typing (debounce), so we don't fire a request on every keystroke.
  const urlSearch = params.search ?? ''
  const [search, setSearch] = useState(urlSearch)
  // The last value this box wrote to the URL. If the URL changes to anything else, the change
  // came from outside (nav link, back button, "Clear"), so the box must follow the URL.
  const lastPushed = useRef(urlSearch)

  useEffect(() => {
    if (urlSearch !== lastPushed.current) {
      lastPushed.current = urlSearch
      setSearch(urlSearch)
    }
  }, [urlSearch])

  useEffect(() => {
    const next = search.trim()
    if (next === lastPushed.current) return
    const timer = setTimeout(() => {
      lastPushed.current = next
      setFilters({ search: next })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, setFilters])

  // On phones the extra filters fold away behind a button; on md+ they're always visible.
  const activeCount = [params.categoryId, params.from, params.to].filter(Boolean).length
  const [expanded, setExpanded] = useState(activeCount > 0)

  const clear = () => {
    lastPushed.current = ''
    setSearch('')
    clearFilters()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              type="search"
              className="pl-8"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Button
          variant="outline"
          className="md:hidden"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="expense-filter-panel"
        >
          <SlidersHorizontal />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      <div
        id="expense-filter-panel"
        className={cn(
          'grid grid-cols-2 gap-3 md:grid-cols-[1fr_10rem_10rem_auto] md:items-end',
          !expanded && 'max-md:hidden',
        )}
      >
        <div className="col-span-2 grid gap-1.5 md:col-span-1">
          <Label htmlFor="category-filter">Category</Label>
          <CategorySelect
            id="category-filter"
            className="w-full"
            allowAll
            categories={categories}
            value={params.categoryId ?? ALL_CATEGORIES}
            onChange={(value) =>
              setFilters({ categoryId: value === ALL_CATEGORIES ? undefined : value })
            }
          />
        </div>
        <div className="grid min-w-0 gap-1.5 max-[359px]:col-span-2">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={params.from ?? ''}
            max={params.to}
            onChange={(e) => setFilters({ from: e.target.value })}
          />
        </div>
        <div className="grid min-w-0 gap-1.5 max-[359px]:col-span-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={params.to ?? ''}
            min={params.from}
            onChange={(e) => setFilters({ to: e.target.value })}
          />
        </div>
        <Button
          variant="ghost"
          className="col-span-2 md:col-span-1"
          onClick={clear}
          disabled={!hasFilters}
        >
          <X /> Clear filters
        </Button>
      </div>
    </div>
  )
}
