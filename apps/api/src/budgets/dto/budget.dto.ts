import { CategorySummaryDto } from '../../categories/dto/category-summary.dto.js';

export class BudgetDto {
  id: string;
  /** YYYY-MM */
  month: string;
  /** Budget limit in cents/paise. */
  amount: number;
  categoryId: string;
  category: CategorySummaryDto;
  /** Total spent in this category during the month (cents/paise). */
  spent: number;
  /** amount - spent. Negative when over budget. */
  remaining: number;
}
