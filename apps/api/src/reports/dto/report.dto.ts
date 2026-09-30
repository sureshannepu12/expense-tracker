import { ApiProperty } from '@nestjs/swagger';

export class CategoryTotalDto {
  categoryId: string;
  name: string;
  color: string;

  @ApiProperty({ type: String, nullable: true })
  icon: string | null;

  /** Sum in cents/paise. */
  total: number;
  count: number;
}

export class MonthlyTotalDto {
  /** YYYY-MM */
  month: string;
  /** Sum in cents/paise. */
  total: number;
}

export class SummaryDto {
  /** YYYY-MM */
  month: string;
  /** Total spent this month (cents/paise). */
  total: number;
  /** Number of expenses this month. */
  count: number;
  /** Total spent in the previous month, for comparison. */
  previousMonthTotal: number;
  /** Sum of all category budgets for this month. */
  budgetTotal: number;

  @ApiProperty({ type: CategoryTotalDto, nullable: true })
  topCategory: CategoryTotalDto | null;
}
