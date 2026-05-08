# Deployment Notes

SplitApp is scoped for a web release: one backend API, one frontend static app, and one PostgreSQL database.

This document is provider-neutral on purpose. Fill in provider-specific values once the hosting target is chosen.

## Runtime Pieces

- Backend: ASP.NET Core API.
- Frontend: Vite static build.
- Database: PostgreSQL.
- Realtime: SignalR over WebSocket or fallback transports.

## Backend Configuration

Required production-like environment variables:

| Key | Example | Notes |
| --- | --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` | Do not rely on development fallbacks. |
| `ConnectionStrings__DefaultConnection` | `Host=...;Port=5432;Database=...;Username=...;Password=...` | PostgreSQL connection string. |
| `Jwt__Key` | long random secret | Required outside Development/Testing. |
| `Jwt__Issuer` | `SplitApp` | Must match token validation settings. |
| `Jwt__Audience` | `SplitAppUsers` | Must match token validation settings. |
| `Authentication__Google__ClientId` | Google client id | Optional. Used by backend token validation when Google sign-in is enabled. |
| `Cors__AllowedOrigins__0` | `https://your-frontend.example.com` | Add more origins with `__1`, `__2`, etc. |

The API exposes:

```text
GET /api
GET /health
```

Use `/api` for a simple browser-visible API status payload. Use `/health` for platform health checks or uptime monitoring.

## Frontend Configuration

Required build-time variables:

| Key | Example | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://your-api.example.com/api` | Must include `/api`. |
| `VITE_GOOGLE_CLIENT_ID` | Google client id | Optional. Used by the browser Google login button. |

Build command:

```bash
cd frontend
npm ci
npm run build
```

Output directory:

```text
frontend/dist
```

## Google OAuth

Google sign-in is optional. If enabled, configure the Google Cloud OAuth client with:

- deployed frontend origin;
- local frontend origin if local testing is needed;
- the same client id in frontend and backend config.

The backend validates Google credentials using `Authentication__Google__ClientId`.

## Database And Migrations

The API applies EF Core migrations on startup.

Before first deploy:

1. Create PostgreSQL database.
2. Configure `ConnectionStrings__DefaultConnection`.
3. Start API once and confirm migrations apply.
4. Check logs for migration/auth/CORS errors.

For a small self-hosted instance, automatic startup migration is acceptable. For a higher-stakes production environment, move migrations into an explicit deployment step.

## CORS

Backend CORS is controlled by `Cors:AllowedOrigins`.

Local fallback origins:

- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:4173`

Production must configure the deployed frontend origin explicitly.

## SignalR

Confirm the hosting provider supports WebSockets or SignalR fallback transports.

Manual check:

1. Open a group page in two browser sessions.
2. Add an expense in one session.
3. Confirm the other session refreshes group data.

## Release Verification

Backend:

```bash
dotnet test backend/SplitApp.slnx
dotnet build backend/SplitApp.slnx --configuration Release
```

Frontend:

```bash
cd frontend
npm ci
npm run test
npm run lint
npm run build
npm audit --omit=dev
```

Deployed smoke:

- `GET /health` returns `{ "status": "ok" }`.
- Frontend loads from a clean browser session.
- Login/register works.
- Group details loads with authenticated API calls.
- SignalR does not fail continuously in logs.
