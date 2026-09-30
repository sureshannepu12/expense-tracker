import { CategorySummaryDto } from './category-summary.dto.js';

export class CategoryDto extends CategorySummaryDto {
  /** How many expenses use this category. */
  expenseCount: number;
}
