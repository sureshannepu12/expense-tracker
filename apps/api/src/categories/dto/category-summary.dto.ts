import { ApiProperty } from '@nestjs/swagger';

/** The small category shape embedded in expenses and budgets. */
export class CategorySummaryDto {
  id: string;
  name: string;
  color: string;

  @ApiProperty({ type: String, nullable: true })
  icon: string | null;
}
