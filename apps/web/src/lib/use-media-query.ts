import { useCallback, useMemo, useSyncExternalStore } from 'react'

/** True while the CSS media query matches, e.g. useMediaQuery('(min-width: 768px)'). */
export function useMediaQuery(query: string): boolean {
  // One MediaQueryList and one stable subscribe function per query, so React
  // doesn't re-subscribe the listener on every render.
  const media = useMemo(() => window.matchMedia(query), [query])
  const subscribe = useCallback(
    (onChange: () => void) => {
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    [media],
  )
  return useSyncExternalStore(subscribe, () => media.matches)
}
