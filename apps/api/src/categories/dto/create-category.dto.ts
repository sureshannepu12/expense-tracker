import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  /** @example Groceries */
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  name: string;

  /** Hex color used in charts and badges, always "#rrggbb". @example #22c55e */
  @IsOptional()
  @Matches(/^#[0-9a-f]{6}$/i, { message: 'color must be a hex color like #22c55e' })
  color?: string;

  /** A short emoji shown next to the name. Send null to remove it. */
  @ApiPropertyOptional({ type: String, nullable: true, example: '🛒' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string | null;
}
