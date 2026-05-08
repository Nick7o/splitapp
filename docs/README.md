# SplitApp Documentation

SplitApp is a group expense sharing web app. The root `README.md` is the public project entrypoint; this folder contains the technical documentation behind it.

## Documentation Map

- [Architecture](./ARCHITECTURE.md) - backend/frontend structure, key patterns, and important design decisions.
- [API](./API.md) - REST contract, authentication, errors, realtime events, and example payloads.
- [Database](./DATABASE.md) - current EF Core schema and migration policy.
- [Deployment](./DEPLOYMENT.md) - provider-neutral hosting configuration and smoke checks.
- [Development](./DEVELOPMENT.md) - local setup, configuration, commands, and troubleshooting.
- [Testing](./TESTING.md) - test strategy, current coverage, commands, and conventions.
- [Roadmap](./ROADMAP.md) - recommended next work for the self-hostable web app.
- [Release](./RELEASE.md) - repository release and manual smoke checklist.

## Current Capabilities

- Email/password and Google login with JWT authentication.
- Groups with owner/admin/member roles.
- Multi-currency expenses with equal, exact, and percent split modes.
- Per-currency balances calculated from expenses and recorded payments.
- Optimized debt suggestions for each currency.
- Payment recording and voiding through a dedicated `Payments` table.
- Activity feed generated from stable activity types and metadata.
- Polish and English UI translations, including API error codes.
- Toast/snackbar feedback for API errors and lightweight success states.
- Clickable member names and avatars in core group workflows.
- SignalR updates for expense and payment changes.
- Backend and frontend automated tests.
- Native wrappers and offline-first installation flows are outside the current web-app scope.

Local URLs:

- API: `http://localhost:5223/api`
- Frontend: `http://localhost:5173`
- Visual review route: `http://localhost:5173/design-system`

## Core Product Terms

**Expense**  
Money paid by one group member for one or more members. Expenses create balances.

**Expense split**  
The amount owed by a user for a given expense. `ExpenseSplits` use `(ExpenseId, UserId)` as a composite key.

**Payment**  
A real-world settlement from one member to another. Payments are not expenses. They reduce balances and can be voided if recorded by mistake.

**Balance**  
The net amount a user should receive or pay, calculated from expenses and recorded payments. Positive means the user is owed money. Negative means the user owes money.

**Optimized debt**  
A suggested transfer produced from net balances to reduce the number of payments needed to settle a group.

## Quality Gates

Run these before handing off a change:

```bash
dotnet test backend/SplitApp.slnx
cd frontend
npm run test
npm run lint
npm run build
npm audit --omit=dev
```

For frontend coverage:

```bash
cd frontend && npm run test:coverage
```
