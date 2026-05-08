# SplitApp

SplitApp is a full-stack web application for splitting group expenses, tracking per-currency balances, and recording real-world settlement payments.

It is built as a self-hostable web app with a .NET backend, React frontend, and PostgreSQL database.

## Core Features

- Email/password and Google authentication with JWT sessions.
- Groups with owner/admin/member roles.
- Multi-currency expenses with equal, exact, and percent split modes.
- Per-currency balances calculated from expenses and recorded payments.
- Optimized settlement suggestions that reduce the number of direct transfers.
- Dedicated payment history with `Recorded` and `Voided` states.
- Activity feed based on structured activity metadata.
- Realtime group refresh through SignalR.
- Profile previews, member avatars, app-native confirmation dialogs, and responsive core flows.
- English and Polish UI translations.
- Backend and frontend automated tests.

## Tech Stack

Backend:

- ASP.NET Core
- EF Core
- PostgreSQL
- JWT bearer auth
- Google auth
- SignalR
- xUnit

Frontend:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- i18next
- Vitest and Testing Library

Tooling:

- GitHub Actions CI
- Docker Compose for local PostgreSQL
- npm audit for production frontend dependencies

## Architecture Highlights

- Balances are derived from expenses, splits, and recorded payments instead of being stored in a mutable balance table.
- Payments are separate from expenses. A payment represents money actually sent between people and can be voided without deleting history.
- Activity logs store facts (`activityType` + metadata), not translated UI copy.
- Backend errors use stable `ProblemDetails.code` values that the frontend translates locally.
- The debt graph is lazy-loaded because it is the heaviest UI feature.

## Local Setup

Prerequisites:

- .NET SDK 10
- Node.js 24
- Docker with Compose

Start PostgreSQL:

```bash
docker compose up -d db
```

Run the API:

```bash
dotnet run --project backend/SplitApp.Api
```

The API base URL is:

```text
http://localhost:5223/api
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server is usually:

```text
http://localhost:5173
```

The internal visual review route is available at:

```text
http://localhost:5173/design-system
```

Useful frontend environment variables:

```text
VITE_API_BASE_URL=http://localhost:5223/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

`VITE_GOOGLE_CLIENT_ID` is optional. If it is not configured, the Google sign-in button is hidden and email/password authentication remains available.

In development and testing, the API uses a local-only JWT fallback key if `Jwt:Key` is not configured. Production-like environments must provide `Jwt:Key` through secrets or environment variables.

## Quality Gate

Backend:

```bash
dotnet test backend/SplitApp.slnx
```

Frontend:

```bash
cd frontend
npm run test
npm run lint
npm run build
npm audit --omit=dev
```

Current automated test counts:

- Backend: 33 tests
- Frontend: 17 tests

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [Database](docs/DATABASE.md)
- [Deployment notes](docs/DEPLOYMENT.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Testing guide](docs/TESTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Release checklist](docs/RELEASE.md)

## Current Scope

- SplitApp is currently a responsive web app.
- Native wrappers, install prompts, and offline-first behavior are not part of the current codebase.
- The settlement suggestion list remains the primary action surface; the debt graph is an inspectable visual aid.
