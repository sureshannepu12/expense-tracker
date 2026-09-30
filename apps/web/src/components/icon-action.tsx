import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Small icon-only button for row actions (edit, delete…).
 * `label` becomes both the screen-reader name and the hover tooltip.
 */
export function IconAction({
  label,
  tone = 'default',
  className,
  children,
  ...props
}: ComponentProps<typeof Button> & { label: string; tone?: 'default' | 'danger' }) {
  return (
    <Button
      // Default to "button": inside a <form>, a plain <button> would submit it.
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className={cn(
        'cursor-pointer text-muted-foreground hover:text-foreground',
        tone === 'danger' && 'hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
