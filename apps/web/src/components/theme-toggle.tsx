import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useResolvedTheme, useThemeStore } from '@/lib/theme'

export function ThemeToggle() {
  const setTheme = useThemeStore((s) => s.setTheme)
  const isDark = useResolvedTheme() === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
