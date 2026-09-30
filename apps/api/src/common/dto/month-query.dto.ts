import { IsOptional, Matches } from 'class-validator';
import { MONTH_REGEX } from '../month.js';

export class MonthQueryDto {
  /** Month in YYYY-MM format. Defaults to the current month. @example 2026-09 */
  @IsOptional()
  @Matches(MONTH_REGEX, { message: 'month must be in YYYY-MM format' })
  month?: string;
}
