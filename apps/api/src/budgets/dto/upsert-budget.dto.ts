import { IsInt, IsString, Matches, Max, Min } from 'class-validator';
import { MONTH_REGEX } from '../../common/month.js';

export class UpsertBudgetDto {
  @IsString()
  categoryId: string;

  /** @example 2026-09 */
  @Matches(MONTH_REGEX, { message: 'month must be in YYYY-MM format' })
  month: string;

  /** Budget limit in cents/paise. @example 500000 */
  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  amount: number;
}
