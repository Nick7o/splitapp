# Roadmap

This roadmap tracks SplitApp as a self-hostable web application for shared expenses.

The current release target is:

- a backend API that can be run locally or self-hosted;
- a frontend web app that can be run locally or self-hosted;
- PostgreSQL persistence;
- public source code with practical setup, deployment, API, and testing documentation.

Out of current scope:

- Native mobile wrapper.
- App-store packaging.
- Install/offline-first behavior.

Install/offline tooling was removed to keep the web release simpler to test and maintain.

## Current State

Done:

- Clean EF Core baseline migration.
- Stable camelCase API contract.
- Owner represented through group membership role.
- Payments modeled as their own table with `Recorded` and `Voided` states.
- Activity feed based on type + metadata rather than stored UI copy.
- Backend `ProblemDetails` error codes.
- Frontend API error translations.
- Backend and frontend automated tests.
- Route-level lazy loading and lazy debt graph.
- Toast feedback and form-level validation.
- API integration tests for auth and group workflows.
- CI pipeline with backend tests, frontend tests, lint, build, and audit.
- Exception logging and production-safe JWT configuration with local dev fallback.
- Core group UX polish: clickable member identities, responsive balances list, compact payment history, and debt graph without the mobile minimap.
- Product polish pass: calmer dashboard and group flows, rebuilt expense creation layout, app-native confirmations, scroll-locked dialogs, corrected member settlement previews, and consistent empty/error/loading states.
- Design-system review screen for typography, action hierarchy, data pills, cards, financial rows, and the debt graph.
- Install/offline tooling, service worker registration, install prompts, related icons, smoke script, and Workbox dependencies removed.
- Root README rewritten as the public project entrypoint.
- Release checklist added.
- Provider-neutral deployment notes added.

## Phase 1: Foundation And Hardening

Status: Done.

Goal: make the app reliable enough to run locally, test automatically, and deploy safely.

Done:

- Add toast/snackbar UI for API errors instead of `alert`.
- Add form-level validation messages for expenses and payments.
- Add API integration tests for auth and group workflows.
- Add CI pipeline with backend tests, frontend tests, lint, build, and audit.
- Add logging around unexpected API exceptions.
- Replace committed development JWT secret with env/user-secret configuration outside development, while keeping a local-only fallback for normal dev startup.
- Replace browser confirmation prompts with app-native confirmation dialogs.

## Phase 2: Product Polish

Status: Done enough for the first public release, with only targeted polish allowed.

Goal: make the core flows feel calm, trustworthy, and professional.

Done:

- Rebuilt the dashboard around current balance, group readiness, clearer group rows, and a stronger empty state.
- Reworked group details into a calmer overview with balance/spending/transfer metrics, member preview chips, grouped expenses, and clearer primary actions.
- Rebuilt expense creation/editing so the payer, amount, split method, participant selection, split totals, and save readiness are visible and aligned.
- Corrected member profile settlement previews so they use optimized payment transfers instead of raw net balances.
- Made member profile previews consistent and removed distracting hover/landing movement from identity surfaces.
- Polished balances, settlement suggestions, payment history, group settings, activity history, join flow, and bottom navigation states.
- Standardized empty, loading, retry, and error states across the main app surfaces.
- Added internal design-system review route for visual QA.

Allowed remaining work:

- Fix release-blocking UI issues found during a focused manual smoke test.
- Tighten copy where a real user flow is unclear.
- Keep the responsive web experience good on mobile viewports.

Not allowed unless a bug requires it:

- Large redesigns.
- New product features.
- App-store, native-mobile, or install/offline preparation.

## Phase 3: Repository Release

Status: Next.

Goal: make SplitApp easy to run, inspect, and self-host from source.

### Scope Control

- Done: remove install/offline tooling and release scope.
- Done: move private notes out of public documentation.
- Done: add root `README.md` as the public project entrypoint.
- Done: add release checklist.
- Done: remove stale generated frontend design drafts.
- Done: remove stale scratch notes from the repository root.
- Keep the release as a responsive web app.
- Do not reintroduce install/offline, app-store, or native-mobile scope during release cleanup.

### Deployment

- Done: add provider-neutral deployment notes in `docs/DEPLOYMENT.md`.
- Done: add `/health` endpoint for hosting checks.
- Done: make backend CORS origins configurable through `Cors:AllowedOrigins`.
- Keep deployment documentation provider-neutral.
- Do not require a live deployment for the first public repository release.
- Document the production-like environment variables needed by self-hosters.
- Document database hosting, migrations, CORS, HTTPS, auth secrets, and optional Google OAuth setup.
- Document the operational checks a self-hoster should run after deployment.

### Documentation

- Done: rewrite root `README.md` as public project documentation.
- Done: add `docs/RELEASE.md`.
- Done: explain the problem, main flows, architecture, and tradeoffs in the root README.
- Include screenshots when available.
- Done: document tech stack: .NET, EF Core, auth, SignalR, React, Vite, tests, CI, deployment.
- Keep setup instructions concise and reproducible.
- Keep `API.md` focused on useful endpoint behavior, not exhaustive noise.
- Keep `TESTING.md` focused on how to run and what the tests cover.

### Quality Gate

- Frontend: lint, tests, build.
- Backend: tests, build.
- Manual smoke test:
  - register/login/logout;
  - create group;
  - invite/join group;
  - add/edit/delete expense;
  - inspect balances;
  - record/undo payment;
  - inspect activity history;
  - update profile;
  - verify core screens on desktop and mobile viewport.
- For any future hosted instance, confirm the app works from a clean browser session.

## Phase 4: Post-release Improvements

Status: Later.

Goal: improve the product based on real usage and maintenance needs.

Possible work:

- Screenshots in the README.
- More detailed admin/operator notes for self-hosting.
- More advanced activity diffs for edited expenses.
- Receipt uploads.
- Recurring expenses.
- Export/import for groups.
- More visual polish after feedback from real users.
