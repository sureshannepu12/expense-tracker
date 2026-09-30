import {
  IsDateString,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  /** Amount in cents/paise (e.g. 1250 = 12.50). @example 1250 */
  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  amount: number;

  /** @example Lunch with team */
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description: string;

  /** Date the money was spent (YYYY-MM-DD). @example 2026-09-30 */
  @IsDateString()
  date: string;

  @IsString()
  categoryId: string;
}
