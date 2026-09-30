import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retrying a 4xx (bad input, not found, unauthorized) never helps.
      retry: (failureCount, error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
  },
})

// Orval query keys start with the endpoint URL, e.g. ['/expenses', { page: 1 }].
const SPENDING_KEYS = ['/expenses', '/reports', '/budgets', '/categories']

/**
 * Expenses feed the dashboard, budgets and category counts, so after any
 * change we mark all of those queries stale and let TanStack Query refetch them.
 */
export function invalidateSpendingData() {
  return queryClient.invalidateQueries({
    predicate: ({ queryKey }) =>
      typeof queryKey[0] === 'string' &&
      SPENDING_KEYS.some((prefix) => (queryKey[0] as string).startsWith(prefix)),
  })
}
