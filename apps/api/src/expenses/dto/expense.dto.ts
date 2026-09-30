import { CategorySummaryDto } from '../../categories/dto/category-summary.dto.js';

export class ExpenseDto {
  id: string;
  /** Amount in cents/paise. */
  amount: number;
  description: string;
  date: Date;
  categoryId: string;
  category: CategorySummaryDto;
  createdAt: Date;
  updatedAt: Date;
}
