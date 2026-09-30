import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// E2E test: boots the whole app against the real database (docker compose must be running).
// Every run uses fresh, unique users and deletes them afterwards.
describe('Expense tracker API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = Date.now();
  const alice = { email: `alice-${runId}@e2e.test`, name: 'Alice', password: 'password123' };
  const bob = { email: `bob-${runId}@e2e.test`, name: 'Bob', password: 'password123' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@e2e.test' } } });
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  it('rejects requests without a token', async () => {
    await api().get('/expenses').expect(401);
  });

  it('validates the register payload', async () => {
    const res = await api()
      .post('/auth/register')
      .send({ email: 'not-an-email', name: 'A', password: 'short' })
      .expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining(['email must be an email']),
    );
  });

  it('registers, logs in, creates an expense and keeps users isolated', async () => {
    // Register Alice: she gets the default categories.
    const registered = await api().post('/auth/register').send(alice).expect(201);
    expect(registered.body.user).not.toHaveProperty('passwordHash');

    await api().post('/auth/register').send(alice).expect(409);

    // Log in and use the token.
    const login = await api()
      .post('/auth/login')
      .send({ email: alice.email, password: alice.password })
      .expect(200);
    const aliceToken: string = login.body.accessToken;
    const asAlice = (req: request.Test) => req.set('Authorization', `Bearer ${aliceToken}`);

    const categories = await asAlice(api().get('/categories')).expect(200);
    expect(categories.body.length).toBeGreaterThan(0);
    const food = categories.body.find((c: { name: string }) => c.name === 'Food');

    const created = await asAlice(api().post('/expenses'))
      .send({ amount: 45050, description: 'Groceries', date: '2026-09-15', categoryId: food.id })
      .expect(201);
    expect(created.body).toMatchObject({ amount: 45050, category: { name: 'Food' } });

    const list = await asAlice(api().get('/expenses?search=groc')).expect(200);
    expect(list.body.meta.total).toBe(1);

    const summary = await asAlice(api().get('/reports/summary?month=2026-09')).expect(200);
    expect(summary.body).toMatchObject({ total: 45050, count: 1 });

    // Bob can't see or touch Alice's data.
    const bobRes = await api().post('/auth/register').send(bob).expect(201);
    const asBob = (req: request.Test) =>
      req.set('Authorization', `Bearer ${bobRes.body.accessToken}`);

    const bobList = await asBob(api().get('/expenses')).expect(200);
    expect(bobList.body.meta.total).toBe(0);
    await asBob(api().get(`/expenses/${created.body.id}`)).expect(404);
    await asBob(api().delete(`/expenses/${created.body.id}`)).expect(404);
    await asBob(api().post('/expenses'))
      .send({ amount: 100, description: 'Sneaky', date: '2026-09-15', categoryId: food.id })
      .expect(404);
  });

  describe('categories and reports', () => {
    let token: string;
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

    beforeAll(async () => {
      const res = await api()
        .post('/auth/register')
        .send({ email: `carol-${runId}@e2e.test`, name: 'Carol', password: 'password123' })
        .expect(201);
      token = res.body.accessToken;
    });

    it('only accepts #rrggbb colors', async () => {
      await auth(api().post('/categories')).send({ name: 'Bad', color: 'f97316' }).expect(400);
      await auth(api().post('/categories')).send({ name: 'Short', color: '#abc' }).expect(400);
      await auth(api().post('/categories')).send({ name: 'Good', color: '#AABBCC' }).expect(201);
    });

    it('removes an icon when null is sent', async () => {
      const created = await auth(api().post('/categories'))
        .send({ name: 'Pets', icon: '🐶' })
        .expect(201);
      const updated = await auth(api().patch(`/categories/${created.body.id}`))
        .send({ icon: null })
        .expect(200);
      expect(updated.body.icon).toBeNull();
    });

    it('sums monthly totals beyond 32-bit integers and honours endMonth', async () => {
      const categories = await auth(api().get('/categories')).expect(200);
      const categoryId = categories.body[0].id;
      // Three maximum-size expenses = 3,000,000,000 paise, more than 2^31 - 1.
      for (let i = 0; i < 3; i++) {
        await auth(api().post('/expenses'))
          .send({ amount: 1_000_000_000, description: `Big ${i}`, date: '2025-03-10', categoryId })
          .expect(201);
      }
      const res = await auth(api().get('/reports/monthly?months=2&endMonth=2025-03')).expect(200);
      expect(res.body).toEqual([
        { month: '2025-02', total: 0 },
        { month: '2025-03', total: 3_000_000_000 },
      ]);
    });
  });
});
