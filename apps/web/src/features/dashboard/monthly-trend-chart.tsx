import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import type { MonthlyTotalDto } from '@/api/generated/model'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatMonth, formatMonthShort } from '@/lib/dates'
import { formatMoney, formatMoneyCompact } from '@/lib/money'

const chartConfig = {
  total: { label: 'Spent', color: 'var(--chart-1)' },
} satisfies ChartConfig

/**
 * One series, so no legend: the card title names it.
 * The selected month is drawn in the accent color and the rest in gray (emphasis).
 */
export function MonthlyTrendChart({
  data,
  selectedMonth,
}: {
  data: MonthlyTotalDto[]
  selectedMonth: string
}) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonthShort}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={(value: number) => formatMoneyCompact(value)}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                formatMonth(String(payload[0]?.payload?.month ?? ''))
              }
              formatter={(value) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatMoney(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={44}>
          {data.map((row) => (
            <Cell
              key={row.month}
              fill={
                row.month === selectedMonth
                  ? 'var(--color-total)'
                  : 'var(--muted-foreground)'
              }
              fillOpacity={row.month === selectedMonth ? 1 : 0.3}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
