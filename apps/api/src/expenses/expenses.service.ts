import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service.js';
import { endOfDayExclusive } from '../common/month.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseQueryDto } from './dto/expense-query.dto.js';
import { ExpenseDto } from './dto/expense.dto.js';
import { PaginatedExpensesDto } from './dto/paginated-expenses.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';

// Selecting explicit fields keeps userId out of API responses.
const expenseSelect = {
  id: true,
  amount: true,
  description: true,
  date: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, color: true, icon: true } },
} satisfies Prisma.ExpenseSelect;

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}

  async findAll(
    userId: string,
    query: ExpenseQueryDto,
  ): Promise<PaginatedExpensesDto> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;
    const where = buildWhere(userId, query);

    // Run the page query and the count in one transaction so they agree.
    const [data, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        select: expenseSelect,
        // Secondary sort on id makes paging stable when dates/amounts tie.
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<ExpenseDto> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
      select: expenseSelect,
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async create(userId: string, dto: CreateExpenseDto): Promise<ExpenseDto> {
    await this.categories.assertOwned(userId, dto.categoryId);
    return this.prisma.expense.create({
      data: { ...dto, date: new Date(dto.date), userId },
      select: expenseSelect,
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseDto> {
    await this.findOne(userId, id);
    if (dto.categoryId) {
      await this.categories.assertOwned(userId, dto.categoryId);
    }
    return this.prisma.expense.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      select: expenseSelect,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.expense.delete({ where: { id } });
  }
}

function buildWhere(
  userId: string,
  { from, to, categoryId, search }: ExpenseQueryDto,
): Prisma.ExpenseWhereInput {
  return {
    userId,
    categoryId,
    description: search
      ? { contains: search, mode: 'insensitive' }
      : undefined,
    date:
      from || to
        ? {
            gte: from ? new Date(from) : undefined,
            lt: to ? endOfDayExclusive(to) : undefined,
          }
        : undefined,
  };
}
