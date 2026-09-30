/**
 * Seeds a demo account with ~4 months of realistic expenses and budgets.
 * Run with: pnpm db:seed   (login: demo@example.com / password123)
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { DEFAULT_CATEGORIES } from '../src/categories/default-categories.js';
import { currentMonth, shiftMonth } from '../src/common/month.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DEMO_EMAIL = 'demo@example.com';

// [description, min, max] in whole currency units, per category.
const SAMPLES: Record<string, [string, number, number][]> = {
  Food: [
    ['Groceries', 800, 2500],
    ['Lunch', 150, 450],
    ['Dinner out', 600, 1800],
    ['Coffee', 80, 250],
  ],
  Transport: [
    ['Metro card top-up', 300, 600],
    ['Cab ride', 150, 700],
    ['Fuel', 1000, 2500],
  ],
  Utilities: [
    ['Electricity bill', 1200, 2500],
    ['Internet', 700, 1000],
    ['Mobile recharge', 300, 600],
  ],
  Entertainment: [
    ['Movie tickets', 400, 900],
    ['Streaming subscription', 199, 649],
    ['Concert', 1500, 3500],
  ],
  Shopping: [
    ['Clothes', 1000, 4000],
    ['Electronics accessory', 500, 3000],
    ['Books', 300, 1200],
  ],
  Health: [
    ['Pharmacy', 200, 900],
    ['Gym membership', 1500, 2000],
  ],
  Other: [['Gift', 500, 2500]],
};

// Deterministic pseudo-random numbers so every seed run gives the same data.
let state = 42;
function random() {
  state = (state * 1664525 + 1013904223) % 2 ** 32;
  return state / 2 ** 32;
}
const between = (min: number, max: number) =>
  Math.round(min + random() * (max - min));

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash: await bcrypt.hash('password123', 10),
      categories: { create: DEFAULT_CATEGORIES },
    },
    include: { categories: true },
  });
  const categoryId = (name: string) =>
    user.categories.find((c) => c.name === name)!.id;

  const today = new Date();
  const expenses: {
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
    userId: string;
  }[] = [];

  for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo--) {
    const [year, month] = shiftMonth(currentMonth(), -monthsAgo)
      .split('-')
      .map(Number);
    const lastDay =
      monthsAgo === 0
        ? today.getUTCDate()
        : new Date(Date.UTC(year, month, 0)).getUTCDate();

    // Rent on the 1st of every month.
    expenses.push({
      amount: 18000_00,
      description: 'Monthly rent',
      date: new Date(Date.UTC(year, month - 1, 1)),
      categoryId: categoryId('Rent'),
      userId: user.id,
    });

    const count = Math.round((lastDay / 30) * 28);
    for (let i = 0; i < count; i++) {
      const categories = Object.keys(SAMPLES);
      const category = categories[Math.floor(random() * categories.length)];
      const options = SAMPLES[category];
      const [description, min, max] =
        options[Math.floor(random() * options.length)];
      expenses.push({
        amount: between(min, max) * 100,
        description,
        date: new Date(Date.UTC(year, month - 1, between(1, lastDay))),
        categoryId: categoryId(category),
        userId: user.id,
      });
    }
  }

  await prisma.expense.createMany({ data: expenses });

  const budgets: [string, number][] = [
    ['Food', 12000],
    ['Transport', 5000],
    ['Entertainment', 4000],
    ['Shopping', 8000],
    ['Utilities', 5000],
  ];
  await prisma.budget.createMany({
    data: budgets.map(([name, amount]) => ({
      userId: user.id,
      categoryId: categoryId(name),
      month: currentMonth(),
      amount: amount * 100,
    })),
  });

  console.log(
    `Seeded ${expenses.length} expenses for ${DEMO_EMAIL} (password: password123)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
