import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const EXPENSE_SORT_FIELDS = ['date', 'amount', 'createdAt'] as const;
export type ExpenseSortField = (typeof EXPENSE_SORT_FIELDS)[number];

export class ExpenseQueryDto {
  /** Inclusive start date (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Inclusive end date (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  /** Case-insensitive match on the description. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // Query params always arrive as strings; @Type converts them to numbers before validation.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({
    enum: EXPENSE_SORT_FIELDS,
    enumName: 'ExpenseSortField',
    default: 'date',
  })
  @IsOptional()
  @IsIn(EXPENSE_SORT_FIELDS)
  sortBy?: ExpenseSortField = 'date';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    enumName: 'SortOrder',
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
