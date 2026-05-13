# Testing

SplitApp has automated tests on both backend and frontend.

## Commands

Backend:

```bash
dotnet test backend/SplitApp.slnx
```

Frontend:

```bash
cd frontend
npm run test
npm run test:coverage
npm run lint
npm run build
```

Security audit:

```bash
cd frontend
npm audit --omit=dev
```

## Backend Test Stack

Project:

```text
backend/SplitApp.Tests
```

Tools:

- xUnit
- EF Core InMemory provider
- `Microsoft.NET.Test.Sdk`
- coverlet collector

Current backend coverage areas:

- ISO currency normalization.
- Expense validation.
- Group ownership and roles.
- Balance calculation across currencies.
- Debt optimization.
- Create/update/delete expense handlers.
- Composite-key split updates.
- Record/void payment handlers.
- Remove-member validation with open balances.
- Group details and dashboard query projections.
- API `ProblemDetails` and current-user claim extraction.
- API integration tests for public status endpoints, auth, protected routes, group creation, and group details.

Current backend test count:

```text
33 tests
```

## Frontend Test Stack

Tools:

- Vitest
- Testing Library React
- Testing Library Jest DOM
- Testing Library User Event
- JSDOM
- V8 coverage

Current frontend coverage areas:

- API error code translation.
- Local storage helpers for auth, redirects, and recent currencies.
- Currency formatting.
- Date fallback and relative time behavior.
- `BalancePill` visual states.
- `ProtectedRoute` redirect behavior.
- `RecordGroupPaymentDialog` payment submission and max-amount blocking.

Current frontend test count:

```text
17 tests
```

## What To Test Next

Highest-value next backend tests:

- Auth command handlers with password edge cases.
- Google auth handler behind an adapter to avoid hard-coding Google SDK calls in tests.
- More API integration coverage for expenses, payments, and member role changes.
- PostgreSQL-backed migration smoke test in CI.

Highest-value next frontend tests:

- Add/edit expense form calculations for equal, exact, and percent modes.
- Group settings owner/member permission UI.
- Payments history void flow.
- Activity row metadata rendering.
- Debt graph smoke test with mocked layout data.

## Testing Conventions

Backend:

- Prefer testing application handlers and services over controllers.
- Use real `AppDbContext` with InMemory for handler tests.
- Keep test data explicit: money tests should be readable without mental gymnastics.
- Assert stable error codes, not exception text meant for humans.

Frontend:

- Test behavior visible to users.
- Prefer role/text queries over implementation details.
- Mock API calls at module boundary.
- Keep i18n loaded in tests so labels match real UI strings.

## CI

The repository includes `.github/workflows/ci.yml`. It runs:

```bash
dotnet test backend/SplitApp.slnx
cd frontend
npm ci
npm run test
npm run lint
npm run build
npm audit --omit=dev
```

Add full `npm audit` as a separate non-blocking workflow if dev dependency advisories become noisy.
