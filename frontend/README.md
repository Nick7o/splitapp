# SplitApp Frontend

React + TypeScript + Vite frontend for SplitApp.

Most project-level documentation lives in the root `README.md` and `docs/`.

## Commands

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

## Environment

```text
VITE_API_BASE_URL=http://localhost:5223/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

`VITE_GOOGLE_CLIENT_ID` is optional. Without it, the Google sign-in button is hidden.

## Local URLs

```text
http://localhost:5173
http://localhost:5173/design-system
```

## Notes

- This frontend is scoped as a responsive web app.
- Shared design primitives are defined in `src/index.css`.
- The internal design-system review route is `/design-system`.
