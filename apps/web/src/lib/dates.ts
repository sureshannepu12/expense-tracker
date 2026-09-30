import { addMonths, endOfMonth, format, parseISO } from 'date-fns'

// Months are "YYYY-MM" and days are "YYYY-MM-DD", matching the API.

export const currentMonth = () => format(new Date(), 'yyyy-MM')
export const today = () => format(new Date(), 'yyyy-MM-dd')

const monthStart = (month: string) => parseISO(`${month}-01`)

export const shiftMonth = (month: string, delta: number) =>
  format(addMonths(monthStart(month), delta), 'yyyy-MM')

/** "2026-09" -> "September 2026" */
export const formatMonth = (month: string) =>
  format(monthStart(month), 'MMMM yyyy')

/** "2026-09" -> "Sep" */
export const formatMonthShort = (month: string) =>
  format(monthStart(month), 'MMM')

/** First and last day of a month, for date-range filters. */
export const monthBounds = (month: string) => ({
  from: `${month}-01`,
  to: format(endOfMonth(monthStart(month)), 'yyyy-MM-dd'),
})

/**
 * The API returns expense dates as UTC midnight ("2026-09-22T00:00:00.000Z").
 * Taking the first 10 characters avoids the local timezone shifting the day.
 */
export const toDateInput = (iso: string) => iso.slice(0, 10)

/** "2026-09-22T00:00:00.000Z" -> "22 Sep 2026" */
export const formatDate = (iso: string) =>
  format(parseISO(toDateInput(iso)), 'dd MMM yyyy')
