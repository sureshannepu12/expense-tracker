import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

// Same key as the inline script in index.html, which applies the theme before React loads (no flash).
export const useThemeStore = create<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>()(
  persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), {
    name: 'expense-tracker-theme',
  }),
)

const media = window.matchMedia('(prefers-color-scheme: dark)')
const subscribe = (onChange: () => void) => {
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** The theme actually shown: "system" resolved to light or dark. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useThemeStore((s) => s.theme)
  const systemDark = useSyncExternalStore(subscribe, () => media.matches)
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
}

/** Keeps the `dark` class on <html> in sync (Tailwind's dark: variant reads it). */
export function useApplyTheme() {
  const resolved = useResolvedTheme()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.style.colorScheme = resolved
  }, [resolved])
}
