import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  isForeignKeyViolation,
  isUniqueViolation,
} from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CategoryDto } from './dto/category.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });
    return categories.map(({ _count, userId: _userId, ...category }) => ({
      ...category,
      expenseCount: _count.expenses,
    }));
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryDto> {
    try {
      const category = await this.prisma.category.create({
        data: { ...dto, userId },
      });
      return { ...stripUser(category), expenseCount: 0 };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    await this.assertOwned(userId, id);
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: dto,
        include: { _count: { select: { expenses: true } } },
      });
      const { _count, ...rest } = category;
      return { ...stripUser(rest), expenseCount: _count.expenses };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`Category "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.assertOwned(userId, id);
    const expenseCount = await this.prisma.expense.count({
      where: { categoryId: id },
    });
    if (expenseCount > 0) {
      throw new ConflictException(
        `Category is used by ${expenseCount} expense(s). Move or delete them first.`,
      );
    }
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (error) {
      // An expense was added between the count above and this delete; the
      // onDelete: Restrict foreign key stops it, so report the same conflict.
      if (isForeignKeyViolation(error)) {
        throw new ConflictException(
          'Category is used by an expense. Move or delete it first.',
        );
      }
      throw error;
    }
  }

  /**
   * Throws 404 unless the category exists AND belongs to the user.
   * Returning 404 (not 403) avoids revealing that another user's id exists.
   */
  async assertOwned(userId: string, id: string): Promise<void> {
    const found = await this.prisma.category.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Category not found');
  }
}

function stripUser<T extends { userId: string }>({
  userId: _userId,
  ...rest
}: T): Omit<T, 'userId'> {
  return rest;
}
