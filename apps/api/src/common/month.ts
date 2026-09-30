/** Helpers for "YYYY-MM" month strings. All dates are handled in UTC. */

export const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function currentMonth(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** Returns the [start, end) range of a month as UTC dates. */
export function monthRange(month: string): { start: Date; end: Date } {
  const [year, m] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, m - 1, 1)),
    end: new Date(Date.UTC(year, m, 1)),
  };
}

export function shiftMonth(month: string, delta: number): string {
  const { start } = monthRange(month);
  start.setUTCMonth(start.getUTCMonth() + delta);
  return currentMonth(start);
}

/** "YYYY-MM-DD" -> start of the following day, used as an exclusive upper bound. */
export function endOfDayExclusive(date: string): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}
