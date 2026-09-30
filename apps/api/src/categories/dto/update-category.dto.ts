import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto.js';

// PartialType from @nestjs/swagger (not @nestjs/mapped-types) keeps the Swagger metadata.
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
