# Lyhost Frontend

Web app for **Lyhost**, a multi-tenant SaaS for hotel and property management.
One Angular app for three audiences: staff and owners run their tenant from the admin
back office, guests book units and experiences and pay from the guest portal, and anyone
can browse the public catalog.

**Stack:** Angular 21 · TypeScript · signals · Vitest · Playwright

## Quick start

### 1. Prerequisites

- **Node.js 20+**
- **pnpm** (don't use npm or yarn in this repo)
- Optional: the [backend](https://github.com/LymonColombia/lymon-backend) running
  locally, if you need to change API data or test against your own database

### 2. Install dependencies

```bash
git clone https://github.com/Lymonoficial/lymon-frontend.git
# or over SSH: git clone git@github.com:Lymonoficial/lymon-frontend.git
cd lymon-frontend
pnpm install
```

### 3. Pick the API

The API URL lives in `src/environments/`, not in `.env`:

| File | Used by | `apiUrl` |
|---|---|---|
| `environment.ts` | `pnpm start` and dev builds | shared development backend on Render |
| `environment.production.ts` | `pnpm run build` (swapped in by `angular.json`) | shared development backend on Render |

The defaults work without running anything else. To use a local backend, set `apiUrl` in
`environment.ts` to `http://localhost:3000` and follow the
[backend README](https://github.com/LymonColombia/lymon-backend#quick-start). Don't
commit that change.

`.env` is only for the e2e tests:

```bash
cp .env.example .env
```

| Variable | Needed locally? | What it does |
|---|---|---|
| `MANAGER_EMAIL`, `MANAGER_PASSWORD` | only for Playwright | Staff account that `tests/auth.setup.ts` logs in with |

### 4. Start the app

```bash
pnpm start
```

When the log shows `Local: http://localhost:4200/`, the app is up. It reloads on save.

### 5. Try it

| Area | URL | Account |
|---|---|---|
| Public catalog | http://localhost:4200/lyhost | none |
| Admin back office (staff) | http://localhost:4200/login | a staff account |
| Guest portal | http://localhost:4200/guest/login | a guest account |

Against a local backend, use the accounts it seeds: `dev.owner@lymon.local` (staff) and
`dev.guest@lymon.local` (guest), both with password `DevPassword123!`.

### Everyday commands

```bash
pnpm start                    # dev server on localhost:4200
pnpm lint                     # ESLint (angular-eslint)
pnpm run build                # production build
pnpm test                     # unit tests (Vitest)
pnpm test:cov:scope           # coverage for the files Sonar tracks

pnpm exec playwright test     # e2e tests, against https://lyhost.netlify.app
pnpm cy:open                  # Cypress, interactive
```

### Troubleshooting

- **The first request hangs for a while**: the shared Render backend may be waking up.
  Wait, or point `apiUrl` at a local backend.
- **Every request fails with a network or CORS error**: the backend in `apiUrl` isn't
  running. With a local backend, check that `pnpm dev` is up in `lymon-backend`.
- **Sent back to the login page with `?sessionExpired=true`**: the refresh token has
  expired or belongs to another backend. Log in again. If you switched `apiUrl`, clear the
  `lymon_*` keys from local storage first.
- **Playwright fails at the `setup` project**: `.env` is missing, or its credentials don't
  work on https://lyhost.netlify.app.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow from Jira ticket to merged PR.
