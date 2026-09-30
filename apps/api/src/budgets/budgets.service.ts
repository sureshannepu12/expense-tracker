import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service.js';
import { monthRange } from '../common/month.js';
import { isRecordNotFound } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BudgetDto } from './dto/budget.dto.js';
import { UpsertBudgetDto } from './dto/upsert-budget.dto.js';

const categorySelect = { id: true, name: true, color: true, icon: true };

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}

  async findAll(userId: string, month: string): Promise<BudgetDto[]> {
    const [budgets, spent] = await Promise.all([
      this.prisma.budget.findMany({
        where: { userId, month },
        include: { category: { select: categorySelect } },
        orderBy: { category: { name: 'asc' } },
      }),
      this.spentByCategory(userId, month),
    ]);

    return budgets.map((budget) => toDto(budget, spent.get(budget.categoryId)));
  }

  /** Creates the budget for (category, month), or updates its amount if it exists. */
  async upsert(userId: string, dto: UpsertBudgetDto): Promise<BudgetDto> {
    await this.categories.assertOwned(userId, dto.categoryId);
    const budget = await this.prisma.budget
      .upsert({
        where: {
          userId_categoryId_month: {
            userId,
            categoryId: dto.categoryId,
            month: dto.month,
          },
        },
        create: { ...dto, userId },
        update: { amount: dto.amount },
        include: { category: { select: categorySelect } },
      })
      .catch((error: unknown) => {
        // The budget was deleted by another request while this one was updating it.
        if (isRecordNotFound(error)) {
          throw new ConflictException(
            'This budget was changed at the same time. Please try again.',
          );
        }
        throw error;
      });
    const spent = await this.spentByCategory(userId, dto.month);
    return toDto(budget, spent.get(budget.categoryId));
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.prisma.budget.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('Budget not found');
  }

  /** SELECT categoryId, SUM(amount) ... GROUP BY categoryId, for one month. */
  private async spentByCategory(
    userId: string,
    month: string,
  ): Promise<Map<string, number>> {
    const { start, end } = monthRange(month);
    const rows = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: { gte: start, lt: end } },
      _sum: { amount: true },
    });
    return new Map(rows.map((r) => [r.categoryId, r._sum.amount ?? 0]));
  }
}

function toDto(
  budget: Omit<BudgetDto, 'spent' | 'remaining'> & { userId: string },
  spent = 0,
): BudgetDto {
  const { userId: _userId, ...rest } = budget;
  return { ...rest, spent, remaining: budget.amount - spent };
}
