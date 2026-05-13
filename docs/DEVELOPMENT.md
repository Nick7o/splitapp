# Development Guide

This guide describes the current local workflow for SplitApp.

## Prerequisites

- .NET SDK 10
- Node.js 24 and npm
- Docker with Compose
- PostgreSQL client tools are optional

## Repository Layout

```text
backend/
  SplitApp.Api/
  SplitApp.Application/
  SplitApp.Domain/
  SplitApp.Infrastructure/
  SplitApp.Tests/
frontend/
  src/
docs/
```

## Backend Setup

Start PostgreSQL:

```bash
docker compose up -d db
```

Run API:

```bash
dotnet run --project backend/SplitApp.Api
```

The API listens according to `launchSettings.json`. The API base URL is:

```text
http://localhost:5223/api
```

Opening that URL in a browser returns a small API status payload. Use `http://localhost:5223/health` for a minimal health check.

Configuration lives in:

```text
backend/SplitApp.Api/appsettings.json
```

`Jwt:Key` is intentionally not stored in `appsettings.json`. In `Development` and `Testing`, the API uses a built-in local-only fallback key so the app can start without extra setup. To override it locally, use .NET user secrets or an environment variable:

```bash
dotnet user-secrets set "Jwt:Key" "replace-with-a-local-dev-key-at-least-32-chars" --project backend/SplitApp.Api
export Jwt__Key="replace-with-a-local-dev-key-at-least-32-chars"
```

For production-like environments, `Jwt:Key` is required and must come from user secrets, environment variables, or environment-specific config rather than committed files.

## Frontend Setup

Install dependencies:

```bash
cd frontend
npm install
```

Run development server:

```bash
npm run dev
```

The frontend dev server is usually:

```text
http://localhost:5173
```

Internal visual review route:

```text
http://localhost:5173/design-system
```

If backend URL differs, create a local env file:

```text
VITE_API_BASE_URL=http://localhost:5223/api
```

## Common Commands

From repo root:

```bash
dotnet build backend/SplitApp.slnx
dotnet test backend/SplitApp.slnx
```

From `frontend/`:

```bash
npm run test
npm run test:coverage
npm run lint
npm run build
npm audit --omit=dev
```

CI is defined in `.github/workflows/ci.yml` and runs backend build/test plus frontend install, test, lint, build, and audit.

## Adding Backend Features

Recommended flow:

1. Add or update domain entity only if the data model needs it.
2. Add command/query in `SplitApp.Application`.
3. Implement handler with business validation close to the use case.
4. Return DTOs from application layer.
5. Add/adjust controller endpoint in `SplitApp.Api`.
6. Add tests in `SplitApp.Tests`.
7. Add EF migration if schema changed.

Keep controllers thin. Business rules belong in application handlers/services.

## Adding Frontend Features

Recommended flow:

1. Add API DTO type in `frontend/src/types/api.ts`.
2. Add or update API call in page/component.
3. Use `getApiErrorMessage(error, t)` for API errors.
4. Use storage helpers from `frontend/src/utils/storage.ts`.
5. Add component/unit tests for business-visible behavior.
6. Run `npm run test`, `npm run lint`, and `npm run build`.

Do not add PascalCase/camelCase fallback mapping unless the backend contract actually changes. The API contract should stay camelCase.

## Database Changes

The public migration history starts from `20260428100405_InitialCreate`. New schema changes should be added as forward EF Core migrations; do not rewrite committed migrations. See [Database](./DATABASE.md) for the current schema and migration policy.

## Local Troubleshooting

### API cannot connect to database

Check that Postgres is running:

```bash
docker compose ps
```

Reset local DB if data can be lost:

```bash
docker compose down -v
docker compose up -d db
dotnet run --project backend/SplitApp.Api
```

### Frontend receives 401

Clear local auth state in browser devtools or localStorage:

```text
token
user
redirectAfterLogin
```

### SignalR does not refresh group data

Confirm:

- API is running on the expected origin.
- CORS allows the frontend dev server origin.
- The client joins the group hub after opening group details.

### Tests fail after generating coverage

Coverage output is ignored by ESLint and Git. If stale files still appear in tooling, remove:

```bash
rm -rf frontend/coverage
```
