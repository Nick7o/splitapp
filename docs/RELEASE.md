# Release Checklist

This checklist prepares SplitApp for a public web release and for self-hosting from source.

The target is a responsive web app plus public source code. Native wrappers and offline-first installation flows are intentionally out of scope.

## 1. Scope Lock

- Do not add new product features unless they fix a release-blocking issue.
- Keep the release focused on current core flows:
  - authentication;
  - group creation and joining;
  - expense create/edit/delete;
  - balances and debt graph;
  - payment record/void;
  - activity feed;
  - profile/settings.
- Remove generated drafts, stale scratch notes, and personal notes from public documentation.
- Keep `/design-system` available as an internal visual review route unless it becomes a deployment concern.

## 2. Required Environment

Backend:

| Key | Purpose |
| --- | --- |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string. |
| `Jwt__Key` | Production JWT signing key. Must be at least 32 characters. |
| `Jwt__Issuer` | Token issuer. |
| `Jwt__Audience` | Token audience. |
| `Authentication__Google__ClientId` | Optional Google OAuth client id used to validate credentials. |
| `Cors__AllowedOrigins__0` | Deployed frontend origin. |

Frontend:

| Key | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Public API base URL, ending in `/api`. |
| `VITE_GOOGLE_CLIENT_ID` | Optional Google OAuth client id used by the browser login button. |

Deployment notes:

- Configure HTTPS for both frontend and backend.
- Configure CORS for the deployed frontend origin.
- Configure Google OAuth authorized origins for the deployed frontend.
- Confirm SignalR works through the chosen hosting/proxy setup.
- See `DEPLOYMENT.md` for provider-neutral environment variable names and smoke checks.

## 3. Manual Smoke Test

Run this from a clean browser session before sharing the release.

- Register with email/password.
- Log out and log back in.
- Open `GET /api` and `GET /health` in the browser or with curl.
- Create a group.
- Copy/open an invite link and join the group with another account.
- Add an equal split expense.
- Add an exact split expense.
- Add a percent split expense.
- Edit an expense.
- Delete an expense.
- Open a member profile preview.
- Inspect balances.
- Inspect the debt graph.
- Record a suggested payment.
- Record a manual payment.
- Void a payment.
- Inspect activity history.
- Update profile name/avatar/bio.
- Update group settings as owner.
- Confirm non-owner controls are read-only where expected.
- Check dashboard, group details, add expense, balances, and payments at mobile viewport width.

## 4. Automated Quality Gate

Backend:

```bash
dotnet test backend/SplitApp.slnx
dotnet build backend/SplitApp.slnx --configuration Release
```

Frontend:

```bash
cd frontend
npm run test
npm run lint
npm run build
npm audit --omit=dev
```

## 5. Repository Presentation

- Root `README.md` should explain what SplitApp is, how to run it, and where the docs are.
- `docs/` should contain technical details without private planning notes.
- Put screenshots in `docs/assets/screenshots/` and embed the best 3-4 in the root `README.md`.
- Add a short architecture diagram or flow diagram if time allows.
- Keep known limitations honest and concise.
