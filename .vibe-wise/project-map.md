# Project Map

## Purpose
Lyhost frontend: Angular 21 SaaS for hotel management. Audiences: public catalog, guest portal, tenant admin.

## Requirements
- LYMON-1139: move repo workflow to GitHub Flow and add a CI pipeline for the frontend.
- CONTRIBUTING.md already documents GitHub Flow: `main` only long-lived branch, always deployable; short branches off `main`; PR + 1 approval; squash/rebase merge only.

## Components
- `src/app/{domain,infrastructure,presentation}` — clean architecture (see CLAUDE.md, docs/architecture/).
- `.github/workflows/playwright.yml` — only GH Actions workflow: on push/PR to main/master, installs pnpm via npm, runs Playwright e2e against deployed site (https://lyhost.netlify.app), uploads report.
- `Jenkinsfile` — older pipeline: overwrite environment.ts (localhost API), pnpm install --frozen-lockfile, `test:cov:scope`, SonarQube scan + quality gate, Playwright e2e (creds), Docker build/push to Docker Hub.
- `sonar-project.properties` — Sonar project `lyhost-frontend`, scoped coverage lcov paths.
- `netlify.toml` — Netlify builds `ng build --configuration production`, SPA redirect.
- `Dockerfile` + `nginx.conf` — multi-stage build, nginx-unprivileged on 8080.
- `.github/pull_request_template.md` — PR template.

## Main Flow
Scope update: LYMON-1139 = CI only (lint, build, test). Sonar + CD are later tickets.
Current (verified):
  branch → PR to main → GH Actions: Playwright vs deployed site (not PR code)
  merge to main → Netlify build+deploy
  Jenkins (where it runs / triggers: ?) → unit tests, Sonar, e2e, Docker push
Target CI: not yet designed (learner to decide).

## Data and Trust Boundaries
- e2e needs credentials (MANAGER_*, TEST_ADMIN_*) — Jenkins credentials; GH secrets status unknown.
- Docker Hub creds in Jenkins. Sonar server: unknown host.

## Build and Deployment
- `pnpm run build`, `pnpm test` (vitest via ng test), `pnpm test:cov:scope`, `npx playwright test`.
- packageManager pnpm@10.33.2; Dockerfile pins pnpm@10.33.0, node 20.
- No lint script in package.json.

## Unknowns
- Whether Jenkins is still used / will be replaced by GH Actions.
- Sonar: SonarCloud vs self-hosted.
- Which checks should gate PRs; branch protection settings on GitHub.
- Whether Docker image publishing remains in scope.
