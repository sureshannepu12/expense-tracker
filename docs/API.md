# API reference

The live, always-accurate reference is the Swagger UI at **http://localhost:3000/docs** (raw spec: `/docs-json`, also written to `apps/api/openapi.json`). This page is the human-friendly summary: conventions, every endpoint, and examples.

- [Conventions](#conventions)
- [Auth](#auth)
- [Categories](#categories)
- [Expenses](#expenses)
- [Budgets](#budgets)
- [Reports](#reports)

---

## Conventions

| Topic | Rule |
|---|---|
| Base URL | `http://localhost:3000` |
| Auth | Every endpoint except `POST /auth/register` and `POST /auth/login` needs `Authorization: Bearer <accessToken>` |
| Money | **Integers in the smallest unit** (paise/cents): `1250` = ₹12.50. Max per value: `1,000,000,000`. |
| Dates | Request: `YYYY-MM-DD`. Response: ISO timestamps at UTC midnight (`2026-09-22T00:00:00.000Z`). |
| Months | `YYYY-MM`, e.g. `2026-09` |
| Ranges | `from` and `to` are both **inclusive** dates |
| Unknown fields | Rejected with 400 (`property x should not exist`) |
| Other users' data | Always **404**, never 403 |

### Error format

All errors use NestJS's standard shape. `message` is a string, or an array of strings for validation errors:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email", "password must be longer than or equal to 8 characters"]
}
```

| Status | Meaning |
|---|---|
| 400 | Validation failed |
| 401 | Missing, invalid or expired token; wrong email/password |
| 404 | Not found, or not yours |
| 409 | Conflict: duplicate email or category name, a category still in use, or a concurrent change |

### Trying it in Swagger

1. Open `/docs` and run **POST /auth/login** with `demo@example.com` / `password123`.
2. Copy `accessToken`, click **Authorize** (top right) and paste it.
3. Every other endpoint can now be called with **Try it out**.

With curl:

```bash
TOKEN=$(curl -s -X POST localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"password123"}' | jq -r .accessToken)

curl -s "localhost:3000/expenses?pageSize=5" -H "Authorization: Bearer $TOKEN" | jq
```

---

## Auth

| Method | Path | Body | Success |
|---|---|---|---|
| `POST` | `/auth/register` | `{ email, name, password }` | **201** `AuthResponseDto` (409 if the email exists) |
| `POST` | `/auth/login` | `{ email, password }` | **200** `AuthResponseDto` (401 on bad credentials) |
| `GET` | `/auth/me` | none | **200** `UserDto` |

Validation: `name` 2–50 chars, `password` 8–72 chars (72 is bcrypt's input limit). Emails are stored lower-cased. A new account gets eight starter categories.

```json
// AuthResponseDto
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "cmunq0z3n...", "email": "demo@example.com", "name": "Demo User", "createdAt": "2026-09-30T06:25:17.700Z" }
}
```

Tokens last `JWT_EXPIRES_IN` (default `7d`).

---

## Categories

| Method | Path | Body | Success |
|---|---|---|---|
| `GET` | `/categories` | none | **200** `CategoryDto[]` sorted by name |
| `POST` | `/categories` | `{ name, color?, icon? }` | **201** `CategoryDto` |
| `PATCH` | `/categories/:id` | any of `{ name, color, icon }` | **200** `CategoryDto` |
| `DELETE` | `/categories/:id` | none | **204**, or **409** if the category still has expenses |

- `name`: 1–30 chars, unique per user (409 on duplicates).
- `color`: exactly `#rrggbb` (default `#64748b`).
- `icon`: up to 8 chars (an emoji). Send `null` to remove it.

```json
// CategoryDto
{ "id": "cmunq0z3n0001...", "name": "Food", "color": "#f97316", "icon": "🍔", "expenseCount": 14 }
```

---

## Expenses

| Method | Path | Body | Success |
|---|---|---|---|
| `GET` | `/expenses` | none (query below) | **200** `PaginatedExpensesDto` |
| `GET` | `/expenses/:id` | none | **200** `ExpenseDto` |
| `POST` | `/expenses` | `{ amount, description, date, categoryId }` | **201** `ExpenseDto` |
| `PATCH` | `/expenses/:id` | any subset of the create body | **200** `ExpenseDto` |
| `DELETE` | `/expenses/:id` | none | **204** |

Body rules: `amount` is an integer from 1 to 1,000,000,000, `description` is 1–200 chars, `date` is `YYYY-MM-DD`, and `categoryId` must be one of *your* categories (otherwise 404).

### List query parameters

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int ≥ 1 | `1` | |
| `pageSize` | int 1–100 | `10` | |
| `from`, `to` | `YYYY-MM-DD` | none | Inclusive range |
| `categoryId` | string | none | |
| `search` | string ≤ 100 | none | Case-insensitive match on the description |
| `sortBy` | `date` \| `amount` \| `createdAt` | `date` | Ties are broken by `id`, so paging is stable |
| `sortOrder` | `asc` \| `desc` | `desc` | |

```bash
GET /expenses?from=2026-09-01&to=2026-09-30&categoryId=cmunq...&sortBy=amount&page=2
```

```json
// PaginatedExpensesDto
{
  "data": [
    {
      "id": "cmunq0z4h0036...",
      "amount": 174500,
      "description": "Groceries",
      "date": "2026-09-22T00:00:00.000Z",
      "categoryId": "cmunq0z3n0001...",
      "category": { "id": "cmunq0z3n0001...", "name": "Food", "color": "#f97316", "icon": "🍔" },
      "createdAt": "2026-09-30T06:25:17.776Z",
      "updatedAt": "2026-09-30T06:25:17.776Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 118, "totalPages": 12 }
}
```

`totalPages` is always at least 1, even when there are no results.

---

## Budgets

| Method | Path | Body / query | Success |
|---|---|---|---|
| `GET` | `/budgets?month=YYYY-MM` | `month` defaults to the current UTC month | **200** `BudgetDto[]` |
| `PUT` | `/budgets` | `{ categoryId, month, amount }` | **200** `BudgetDto` (creates or updates) |
| `DELETE` | `/budgets/:id` | none | **204** |

`PUT` is idempotent: there is at most one budget per category per month, so sending the same body twice leaves a single budget. `spent` is calculated live from that month's expenses.

```json
// BudgetDto
{
  "id": "cmunq0z6b003l...",
  "month": "2026-09",
  "amount": 400000,
  "categoryId": "cmunq0z3n0005...",
  "category": { "id": "cmunq0z3n0005...", "name": "Entertainment", "color": "#ec4899", "icon": "🎬" },
  "spent": 604800,
  "remaining": -204800
}
```

A negative `remaining` means the category is over budget.

---

## Reports

| Method | Path | Query | Returns |
|---|---|---|---|
| `GET` | `/reports/summary` | `month?` (default: current) | `SummaryDto` |
| `GET` | `/reports/by-category` | `from?`, `to?` (inclusive dates; omit both for all time) | `CategoryTotalDto[]`, biggest first |
| `GET` | `/reports/monthly` | `months?` (1–24, default 6), `endMonth?` (default: current UTC month) | `MonthlyTotalDto[]`, oldest first; months with no spending are `0` |

```json
// GET /reports/summary?month=2026-09
{
  "month": "2026-09",
  "total": 5181100,
  "count": 29,
  "previousMonthTotal": 5699000,
  "budgetTotal": 3400000,
  "topCategory": { "categoryId": "cmunq...", "name": "Rent", "color": "#8b5cf6", "icon": "🏠", "total": 1800000, "count": 1 }
}
```

```json
// GET /reports/monthly?months=4&endMonth=2026-09
[
  { "month": "2026-06", "total": 4614800 },
  { "month": "2026-07", "total": 5887300 },
  { "month": "2026-08", "total": 5699000 },
  { "month": "2026-09", "total": 5181100 }
]
```

Pass `endMonth` from the client. The browser knows the user's calendar month, while the server's "current month" is in UTC, and the two differ for a few hours around midnight on the 1st.
