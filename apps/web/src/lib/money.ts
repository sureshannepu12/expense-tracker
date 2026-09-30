// The API stores money as integers in the smallest unit (paise/cents).
// These helpers are the only place the UI converts to and from that format.

const CURRENCY = import.meta.env.VITE_CURRENCY ?? 'INR'
const LOCALE = import.meta.env.VITE_LOCALE ?? 'en-IN'

const formatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
})
const compactFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** 123450 -> "₹1,234.50" */
export const formatMoney = (cents: number) => formatter.format(cents / 100)

/** 5181100 -> "₹51.8K" (for chart axes) */
export const formatMoneyCompact = (cents: number) =>
  compactFormatter.format(cents / 100)

/** "12.5" -> 1250 */
export const toCents = (value: string) => Math.round(Number(value) * 100)

/** 1250 -> "12.50" (for pre-filling inputs) */
export const fromCents = (cents: number) => (cents / 100).toFixed(2)

/** A positive amount with at most two decimals. */
export const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/
