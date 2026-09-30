import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MONTH_REGEX } from '../../common/month.js';

export class DateRangeQueryDto {
  /** Inclusive start date (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Inclusive end date (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class MonthlyTrendQueryDto {
  /** How many months to return, ending with `endMonth`. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number = 6;

  /**
   * Last month in the series (YYYY-MM). Defaults to the current month in UTC.
   * The web app sends the month the user is viewing, so the chart always matches their calendar.
   * @example 2026-09
   */
  @IsOptional()
  @Matches(MONTH_REGEX, { message: 'endMonth must be in YYYY-MM format' })
  endMonth?: string;
}
