# Development guide

Everything you need to run, change and test the project locally.

- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
- [Environment variables](#environment-variables)
- [Daily workflow](#daily-workflow)
- [Common tasks](#common-tasks)
- [Recipe: add a new field end to end](#recipe-add-a-new-field-end-to-end)
- [Testing](#testing)
- [Code style](#code-style)
- [Production build](#production-build)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20.19+, 22.12+ or 24+ (Prisma's supported range; newer usually works) | `node -v` |
| pnpm | 10+ | `pnpm -v` (or `corepack enable`) |
| Docker Desktop | any recent | `docker info`: the **daemon must be running** |

## First-time setup

```bash
git clone <your-repo-url> expense-tracker
cd expense-tracker
pnpm install                       # also runs `prisma generate` for the API

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

pnpm db:up                         # Postgres in Docker on localhost:5434
pnpm db:migrate                    # create tables
pnpm db:seed                       # demo user + ~4 months of data

pnpm dev                           # API :3000 + web :5173
```

Open http://localhost:5173 and log in with **demo@example.com / password123**.

## Environment variables

### `apps/api/.env`

| Variable | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://expense:expense@localhost:5434/expense_tracker?schema=public` | Used by Prisma (CLI via `prisma.config.ts`, runtime via `PrismaService`) |
| `JWT_SECRET` | a long random string | Signs access tokens. **Change it** for anything non-local. |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime ([ms](https://github.com/vercel/ms) format) |
| `PORT` | `3000` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | The web app's origin |

Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.

### `apps/web/.env`

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Where the axios instance sends requests |
| `VITE_CURRENCY` | `INR` | Currency code for `Intl.NumberFormat` (e.g. `USD`, `EUR`) |
| `VITE_LOCALE` | `en-IN` | Number formatting locale (e.g. `en-US`) |

`.env` files are git-ignored; only the `.env.example` files are committed.

## Daily workflow

```bash
pnpm db:up     # if the container isn't already running
pnpm dev       # watch mode for both apps
```

- **API** restarts on save and rewrites `apps/api/openapi.json`.
- **Web** hot-reloads in the browser.
- **Swagger UI** is at http://localhost:3000/docs.
- **React Query Devtools** is the floating button bottom-right (desktop widths, dev builds only).
- **Prisma Studio** (a database GUI) opens with `pnpm --filter api db:studio`.

## Common tasks

| I want to… | Run |
|---|---|
| Start / stop the database | `pnpm db:up` / `pnpm db:down` |
| Reset the demo data | `pnpm db:seed` (deletes and recreates only the demo user) |
| Wipe the whole database | `pnpm --filter api exec prisma migrate reset` |
| Change the schema | Edit `apps/api/prisma/schema.prisma`, then `pnpm db:migrate` (it asks for a migration name) |
| Regenerate the Prisma client only | `pnpm --filter api db:generate` |
| Regenerate the React Query client | `pnpm api:gen` (needs an up-to-date `openapi.json`) |
| Type-check the web app | `pnpm --filter web typecheck` |
| Lint everything | `pnpm lint` |

## Recipe: add a new field end to end

Example: add an optional **`note`** to expenses.

1. **Schema**: in `apps/api/prisma/schema.prisma`:
   ```prisma
   model Expense {
     // …
     note String?
   }
   ```
   Run `pnpm db:migrate` and name it `add_expense_note`. This creates `prisma/migrations/<timestamp>_add_expense_note/migration.sql` and regenerates the client.

2. **Request DTO**: in `apps/api/src/expenses/dto/create-expense.dto.ts`:
   ```ts
   /** Free-text details. @example Split with Sam */
   @IsOptional()
   @IsString()
   @MaxLength(500)
   note?: string;
   ```
   `UpdateExpenseDto` extends `PartialType(CreateExpenseDto)`, so it picks this up automatically.

3. **Response DTO + select**: add `note: string | null` (with `@ApiProperty({ type: String, nullable: true })`) to `ExpenseDto`, and `note: true` to `expenseSelect` in `expenses.service.ts`.

4. **Regenerate the client**: save, let the API restart (it rewrites `openapi.json`), then run `pnpm api:gen`.

5. **Let TypeScript guide you**: run `pnpm --filter web typecheck`. `ExpenseDto` now has `note`. Add it to the zod schema, default values and inputs in `expense-form-dialog.tsx`, then show it in the table and list.

6. **Test**: add an assertion to `apps/api/test/app.e2e-spec.ts` and run `pnpm --filter api test:e2e`.

The same four layers apply to any change: **schema → DTO → service → regenerate → UI**.

## Testing

| Suite | Command | What it covers |
|---|---|---|
| API unit | `pnpm test` | `ExpensesService` with a mocked Prisma client: filters, paging, ownership checks |
| API e2e | `pnpm --filter api test:e2e` | Boots the real app against the database: auth, validation, user isolation, the big-sum report, category rules |
| Coverage | `pnpm --filter api test:cov` | V8 coverage report in `apps/api/coverage/` |

- Unit tests live next to the code (`*.spec.ts`), and e2e tests live in `apps/api/test/`.
- E2E tests need the database running (`pnpm db:up`). They create users with unique `@e2e.test` emails and delete them afterwards, so they don't touch the demo data.
- The test runner is **Vitest** (the Nest 12 default), and the API is ESM, so imports use `.js` suffixes.

## Code style

- **Lint:** [oxlint](https://oxc.rs) (`pnpm lint`). The API uses type-aware rules.
- **Format:** Prettier, with single quotes and trailing commas (`pnpm --filter api format`).
- **Imports:** the web app uses the `@/` alias for `src/`, and the API uses relative `.js` paths.
- **Never edit** `apps/web/src/api/generated/**` or `apps/api/src/generated/**`. They are regenerated. `components/ui/**` came from shadcn: edit it on purpose, not casually.

## Production build

```bash
pnpm build                     # nest build + tsc -b && vite build

# API
cd apps/api && NODE_ENV=production node dist/main.js

# Web: static files in apps/web/dist, served by any static host
pnpm --filter web preview      # local preview on :4173
```

For production, also:
- Set a strong `JWT_SECRET` and a real `DATABASE_URL`.
- Run `prisma migrate deploy` instead of `migrate dev`.
- Point `CORS_ORIGIN` / `VITE_API_URL` at the real domains.
- Note that `openapi.json` is only written when `NODE_ENV !== 'production'`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `failed to connect to the docker API … dockerDesktopLinuxEngine` | Docker Desktop isn't running | Start Docker Desktop, wait for "Engine running", then run `pnpm db:up` again |
| `Bind for 0.0.0.0:5434 failed: port is already allocated` | Something else uses the port | Change the host port in `docker-compose.yml` **and** `DATABASE_URL`. Check what's using it with `netstat -ano \| findstr :5434` (Windows) or `lsof -i :5434`. |
| `P1000: Authentication failed` although the container is healthy | You're reaching a **different** Postgres on that port (e.g. a native install) | Same as above: pick a free port. This project uses 5434 because 5432/5433 are often taken. |
| `P1001: Can't reach database server` | The container is stopped | `pnpm db:up`, then `docker ps` should show `expense-tracker-db` as healthy |
| Prisma warns about the Node.js version | Node is newer than Prisma's tested range | Usually harmless; use Node 22/24 LTS if anything misbehaves |
| Web shows "Cannot reach the server" | API not running, or a wrong `VITE_API_URL` | Run `pnpm dev` and check `apps/web/.env` |
| CORS error in the browser console | `CORS_ORIGIN` doesn't match the web URL | Update `apps/api/.env` and restart the API |
| Logged out right after logging in | `JWT_SECRET` changed, so old tokens are invalid | Log in again; tokens signed with the old secret get a 401 |
| TS errors in pages after pulling changes | The generated client is out of date | Restart the API (rewrites `openapi.json`), then `pnpm api:gen` |
| Blank dropdowns or wrong types after a DTO change | Same as above | Same as above |
