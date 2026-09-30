import { Injectable } from '@nestjs/common';
import {
  currentMonth,
  endOfDayExclusive,
  monthRange,
  shiftMonth,
} from '../common/month.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CategoryTotalDto,
  MonthlyTotalDto,
  SummaryDto,
} from './dto/report.dto.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, month: string): Promise<SummaryDto> {
    const { start, end } = monthRange(month);
    const prev = monthRange(shiftMonth(month, -1));

    const [current, previous, budgets, byCategory] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { userId, date: { gte: start, lt: end } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { userId, date: { gte: prev.start, lt: prev.end } },
        _sum: { amount: true },
      }),
      this.prisma.budget.aggregate({
        where: { userId, month },
        _sum: { amount: true },
      }),
      this.totalsByCategory(userId, start, end),
    ]);

    return {
      month,
      total: current._sum.amount ?? 0,
      count: current._count,
      previousMonthTotal: previous._sum.amount ?? 0,
      budgetTotal: budgets._sum.amount ?? 0,
      topCategory: byCategory[0] ?? null,
    };
  }

  byCategory(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<CategoryTotalDto[]> {
    return this.totalsByCategory(
      userId,
      from ? new Date(from) : undefined,
      to ? endOfDayExclusive(to) : undefined,
    );
  }

  /**
   * Monthly totals using raw SQL, because Prisma's groupBy can't group by a
   * computed value like date_trunc('month', date). Months with no spending are filled with 0.
   */
  async monthly(
    userId: string,
    months: number,
    endMonth = currentMonth(),
  ): Promise<MonthlyTotalDto[]> {
    const firstMonth = shiftMonth(endMonth, -(months - 1));
    const { start } = monthRange(firstMonth);
    const { end } = monthRange(endMonth);

    // Tagged template => values become bound parameters, so this is safe from SQL injection.
    // SUM is cast to bigint: a month's total can exceed a 32-bit int (about 2.1 billion paise).
    const rows = await this.prisma.$queryRaw<{ month: string; total: bigint }[]>`
      SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') AS month,
             SUM("amount")::bigint AS total
      FROM "Expense"
      WHERE "userId" = ${userId} AND "date" >= ${start} AND "date" < ${end}
      GROUP BY 1
      ORDER BY 1
    `;
    const totals = new Map(rows.map((r) => [r.month, Number(r.total)]));

    return Array.from({ length: months }, (_, i) => {
      const month = shiftMonth(firstMonth, i);
      return { month, total: totals.get(month) ?? 0 };
    });
  }

  private async totalsByCategory(
    userId: string,
    gte?: Date,
    lt?: Date,
  ): Promise<CategoryTotalDto[]> {
    const rows = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId, date: gte || lt ? { gte, lt } : undefined },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });
    if (rows.length === 0) return [];

    const categories = await this.prisma.category.findMany({
      where: { id: { in: rows.map((r) => r.categoryId) } },
      select: { id: true, name: true, color: true, icon: true },
    });
    const byId = new Map(categories.map((c) => [c.id, c]));

    return rows.map((row) => {
      const category = byId.get(row.categoryId)!;
      return {
        categoryId: row.categoryId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        total: row._sum.amount ?? 0,
        count: row._count,
      };
    });
  }
}
