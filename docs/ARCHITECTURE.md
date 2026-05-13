# Architecture

SplitApp uses a small Clean Architecture backend and a Vite React frontend. The important boundary is that financial state is not stored as a mutable balance table. It is derived from immutable-ish facts: expenses, splits, and recorded payments.

## Backend Structure

The backend solution is `backend/SplitApp.slnx`.

| Project | Responsibility |
| --- | --- |
| `SplitApp.Domain` | Entity model and domain-facing contracts. Contains `User`, `Group`, `GroupMember`, `Expense`, `ExpenseSplit`, `Payment`, and `ActivityLog`. |
| `SplitApp.Application` | Use cases, commands, queries, DTOs, business services, and validation helpers. Uses MediatR handlers. |
| `SplitApp.Infrastructure` | EF Core `AppDbContext`, database mapping, constraints, and migrations. |
| `SplitApp.Api` | HTTP controllers, JWT setup, SignalR hub, API error middleware, and dependency injection. |
| `SplitApp.Tests` | xUnit tests covering domain rules, application services, handlers, query projections, and API helpers. |

## Application Flow

1. A controller reads the current user id through `CurrentUserExtensions`.
2. The controller sends a command/query through MediatR.
3. The handler loads data through `IAppDbContext`.
4. Business rules are applied in application services/helpers.
5. EF Core persists changes.
6. Handlers publish domain-like app events where the UI needs realtime refresh.
7. API returns DTOs with a camelCase JSON contract.

Controllers should stay thin. They should translate HTTP shape into commands/queries and let centralized middleware handle business exceptions.

## Key Backend Services

### `BalanceCalculator`

`BalanceCalculator` is the single shared balance engine. It is used for group details, dashboard groups, member-removal validation, and debt optimization input.

Rules:

- Expense payer gets `+TotalAmount`.
- Each split user gets `-OwedAmount`.
- Recorded payment `FromUser -> ToUser` adds `+Amount` to `FromUser` and `-Amount` to `ToUser`.
- Voided payments are ignored.
- Balances are separated by currency.

### `DebtOptimizationService`

This service receives per-user net balances and creates direct transfers from debtors to creditors. It does not persist anything. Persisted settlement state is represented only by `Payments`.

### `ExpenseValidation`

Centralizes expense title, amount, split, and split-method validation. This matters because create/update expense must behave identically.

## Ownership And Roles

`Groups` do not have an `OwnerId` column. Ownership is represented by `GroupMembers.Role`.

Role values:

- `Member = 0`
- `Admin = 1`
- `Owner = 2`

The database enforces at most one owner per group with a filtered unique index on `GroupMembers(GroupId)` where `Role = 2`.

## API Errors

The backend returns `ProblemDetails` with a stable `code` extension. The frontend translates `code` through `apiErrors.*` locale keys.

Example:

```json
{
  "type": "about:blank",
  "title": "Request error",
  "status": 400,
  "detail": "expense.splitSumMismatch",
  "code": "expense.splitSumMismatch"
}
```

Do not add per-language backend error messages. API codes are the contract.

## Activity Feed

Activity logs store:

- `ActivityType`
- `MetadataJson`
- `GroupId`
- `UserId`
- `CreatedAt`

They do not store UI copy. Frontend derives text from `ActivityType`, metadata, member names, and locale.

Current activity types:

- `expense.created`
- `expense.updated`
- `expense.deleted`
- `payment.recorded`
- `payment.voided`

## Realtime Updates

SignalR hub: `/hubs/expense`.

Group pages join a SignalR group by group id. Backend publishes:

- `ExpenseAdded`
- `PaymentUpdated`

The frontend reacts by refetching group/payment data. This keeps realtime behavior simple and avoids trying to patch complex balance state client-side.

## Frontend Structure

The frontend lives in `frontend/src`.

| Area | Responsibility |
| --- | --- |
| `pages/` | Route-level views. Loaded lazily from `main.tsx`. |
| `components/` | Shared UI and feature components. |
| `components/Payments/` | Payment recording/history UI. |
| `components/DebtGraph/` | Heavy graph UI, lazy-loaded from balances tab. |
| `types/api.ts` | Shared API DTO types. |
| `utils/storage.ts` | Token, user, redirect, and recent-currency localStorage helpers. |
| `utils/apiError.ts` | ProblemDetails-to-locale error mapping. |
| `locales/` | Polish and English translations. |

## Web Release Direction

The web app is intentionally shaped as a self-hostable release:

- route-level lazy loading,
- heavy debt graph split into its own chunk,
- responsive group/payment workflows,
- stable API DTOs,
- client-side translations for stable backend codes.
