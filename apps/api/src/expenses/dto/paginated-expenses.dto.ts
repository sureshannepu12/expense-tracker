import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto.js';
import { ExpenseDto } from './expense.dto.js';

export class PaginatedExpensesDto {
  data: ExpenseDto[];
  meta: PaginationMetaDto;
}
