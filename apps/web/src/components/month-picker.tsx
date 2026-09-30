import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMonth, shiftMonth } from '@/lib/dates'

export function MonthPicker({
  month,
  onChange,
}: {
  month: string
  onChange: (month: string) => void
}) {
  return (
    <div className="flex w-full items-center justify-between gap-1 rounded-lg border bg-background p-1 sm:w-auto">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Previous month"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium">
        {formatMonth(month)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Next month"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
