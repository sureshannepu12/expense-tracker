import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import {
  ExpenseSortField,
  SortOrder,
  type FindAllExpensesParams,
} from '@/api/generated/model'

export const PAGE_SIZES = [10, 20, 50] as const

const SORT_FIELDS = Object.values(ExpenseSortField)
const SORT_ORDERS = Object.values(SortOrder)

type FilterPatch = Partial<
  Record<keyof FindAllExpensesParams, string | number | undefined>
>

/** Parses a whole number and clamps it to [min, max]; anything unparseable becomes the fallback. */
function toInt(value: string | undefined, fallback: number, min: number, max: number) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, n))
}

/**
 * Keeps the expense filters in the URL (?page=2&categoryId=...), so a filtered
 * view survives a refresh and can be bookmarked or shared.
 */
export function useExpenseFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const get = (key: string) => searchParams.get(key) || undefined

  const sortBy = get('sortBy') as ExpenseSortField | undefined
  const sortOrder = get('sortOrder') as SortOrder | undefined

  const params: FindAllExpensesParams = {
    // URLs can be hand-edited or stale, so never trust them: fall back to sane values.
    page: toInt(get('page'), 1, 1, Number.MAX_SAFE_INTEGER),
    // Only the sizes offered in the dropdown; anything else snaps back to the default.
    pageSize: PAGE_SIZES.find((size) => size === Number(get('pageSize'))) ?? PAGE_SIZES[0],
    from: get('from'),
    to: get('to'),
    categoryId: get('categoryId'),
    search: get('search'),
    sortBy: sortBy && SORT_FIELDS.includes(sortBy) ? sortBy : 'date',
    sortOrder: sortOrder && SORT_ORDERS.includes(sortOrder) ? sortOrder : 'desc',
  }

  /** Changes some filters. Any change except paging jumps back to page 1. */
  const setFilters = useCallback(
    (patch: FilterPatch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '') next.delete(key)
            else next.set(key, String(value))
          }
          if (!('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFilters = () => setSearchParams({}, { replace: true })

  const hasFilters = Boolean(
    params.from || params.to || params.categoryId || params.search,
  )

  return { params, setFilters, clearFilters, hasFilters }
}
