import { NotFoundException } from '@nestjs/common';
import type { CategoriesService } from '../categories/categories.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ExpensesService } from './expenses.service.js';

// Unit test: Prisma and CategoriesService are replaced with mocks, so no database is needed.
describe('ExpensesService', () => {
  const prisma = {
    $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
    expense: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
  const categories = { assertOwned: vi.fn() };
  const service = new ExpensesService(
    prisma as unknown as PrismaService,
    categories as unknown as CategoriesService,
  );

  beforeEach(() => vi.clearAllMocks());

  describe('findAll', () => {
    it('scopes by user, applies filters and paginates', async () => {
      prisma.expense.findMany.mockResolvedValue([]);
      prisma.expense.count.mockResolvedValue(25);

      const result = await service.findAll('user-1', {
        page: 2,
        pageSize: 10,
        from: '2026-09-01',
        to: '2026-09-30',
        search: 'coffee',
        sortBy: 'amount',
        sortOrder: 'asc',
      });

      const args = prisma.expense.findMany.mock.calls[0][0];
      expect(args.where).toMatchObject({
        userId: 'user-1',
        description: { contains: 'coffee', mode: 'insensitive' },
        date: {
          gte: new Date('2026-09-01'),
          lt: new Date('2026-10-01'), // "to" is inclusive, so the bound is the next day
        },
      });
      expect(args.skip).toBe(10);
      expect(args.take).toBe(10);
      expect(args.orderBy).toEqual([{ amount: 'asc' }, { id: 'asc' }]);
      expect(result.meta).toEqual({
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('reports at least one page when there are no results', async () => {
      prisma.expense.findMany.mockResolvedValue([]);
      prisma.expense.count.mockResolvedValue(0);

      const result = await service.findAll('user-1', {});
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('create', () => {
    it("checks the category belongs to the user before creating", async () => {
      categories.assertOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create('user-1', {
          amount: 100,
          description: 'Tea',
          date: '2026-09-30',
          categoryId: 'someone-elses-category',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.expense.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it("returns 404 for another user's expense instead of deleting it", async () => {
      prisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'expense-9')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.expense.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'expense-9', userId: 'user-1' } }),
      );
      expect(prisma.expense.delete).not.toHaveBeenCalled();
    });
  });
});
