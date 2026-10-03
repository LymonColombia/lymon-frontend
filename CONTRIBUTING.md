# Contributing

Every change follows the same path:

**Jira ticket → branch off `main` → code + tests → commits → pull request → 1 approval → merge**

We use [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow):

- `main` is the only long-lived branch, and it must always be deployable.
- Every change gets its own branch off `main`, and goes back into `main` only through a
  reviewed pull request.
- Branches are short-lived, and `main` keeps a linear history (squash or rebase merges,
  no merge commits).

## 1. Start from a Jira ticket

Every change needs a Jira ticket (Task, User Story subtask, or Bug). Its ID, `LYMON-XXX`,
is used in the branch name, every commit, and the PR title.

Move the ticket to **In Progress** when you start working on it.

## 2. Create a branch

Always branch from an up-to-date `main`:

```bash
git switch main
git pull
git switch -c LYMON-XXX-jira-item-name
```

Name the branch after the Jira ticket: its ID, then the ticket title in lowercase with
hyphens, for example `LYMON-1108-re-organize-frontend-folders-by-entities`. This is also
the name Jira generates when you create a branch from the ticket.

Keep branches small and short-lived. If `main` moves while you work, rebase onto it.
Don't merge `main` into your branch, because that adds merge commits and breaks the
linear history:

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease
```

## 3. Write the code

The codebase follows Clean Architecture. In short:

- **domain/**: models, abstract repositories, and use cases. No `HttpClient`, no DTOs, no
  components.
- **infrastructure/**: repository implementations (HTTP), DTOs, mappers, interceptors,
  guards, token storage.
- **presentation/**: pages, components and routes. Pages call use cases, never
  `HttpClient` or a repository implementation.

Each layer is split by **audience** first (`tenant/`, `guest/`, `shared/`), then by
feature, and a feature uses the same folder name in every layer (for example
`domain/tenant/crm`, `infrastructure/tenant/crm`, `presentation/tenant/features/crm`).
Before writing new code, look at a neighbouring feature and follow its patterns.

Components follow the Angular rules in [`docs/architecture/ui.md`](docs/architecture/ui.md):
`OnPush`, `input()` / `output()`, `inject()`, `@if` / `@for`, and no `ngClass`. Code is in
English, and user-facing text is in Spanish.

Import across folders with the `@/` alias (`@/domain/...`) and `@env` for the
environment, never with `../../`.

For the full rules see [`docs/`](docs/).

## 4. Calling a new endpoint

Every API call goes through the same pieces. Use `tenant/crm` as the reference:

```text
src/environments/environment.ts             1. endpoint constant (and in environment.production.ts)
src/app/domain/tenant/<feature>/
  <feature>.model.ts                         2. domain types the UI works with
  <feature>.repository.ts                    3. abstract class: the contract
  use-cases/<action>.use-case.ts             4. @Injectable, one execute() method
src/app/infrastructure/tenant/<feature>/
  <feature>.dto.ts                           5. the raw API shape
  <feature>.mapper.ts                           DTO → model
  <feature>.repository.impl.ts                  HttpClient calls, extends the abstract class
src/app/app.config.ts                        6. { provide: XRepository, useClass: XRepositoryImpl }
```

Skip the DTO and mapper only when the API shape is already the domain shape. If you forget
step 6, the app builds but fails at runtime with `No provider for XRepository`.

## 5. Tests

Every feature or fix ships with tests.

### Unit tests: `pnpm test`

Unit tests use **Vitest**, and the spec sits next to the file it tests
(`get-incident-reports.use-case.spec.ts` next to `get-incident-reports.use-case.ts`).
They need no backend.

Write them especially for:

- **Use cases**: mock the abstract repository with `vi.fn()` and provide it through
  `TestBed`. Cover the success path, each error path, and any caching or composition
  (for example `GetTenantProfileUseCase` caches the profile and shares in-flight
  requests).
- **Mappers**: DTO → model, including missing or `null` fields, enum translation and date
  parsing.
- **Repository implementations**: use `provideHttpClient()` plus
  `provideHttpClientTesting()` and assert the method, URL and body with
  `HttpTestingController`. See `infrastructure/tenant/tenant/tenant.repository.impl.spec.ts`.
- **Pages with logic**: form validation, loading and error signals, and what the page
  shows for each state.

`pnpm test:cov:scope` reports coverage for the files listed in `package.json` and
`sonar-project.properties`. When you add specs that Sonar should track, add them to
both.

### E2E tests: Playwright

Playwright specs live in `tests/e2e/`, written in the screenplay style in
`tests/support/`. They run against the **deployed site**
(`https://lyhost.netlify.app`), not your local server, so they test what is on `main`.
`tests/auth.setup.ts` logs in once with the `.env` credentials and saves the session to
`tests/.auth/manager.json` for the other specs.

```bash
pnpm exec playwright test
pnpm exec playwright test tests/e2e/incident-report   # one folder
```

There are also Cypress specs in `cypress/e2e/` (`pnpm cy:open`).

### Before you push

CI runs the same three checks on every PR (section 7). Run them locally first so the PR
doesn't come back red:

```bash
pnpm lint        # ESLint (angular-eslint), including template accessibility rules
pnpm run build   # type and template errors
pnpm test        # all unit tests
pnpm test --include "src/app/**/<feature>/**/*.spec.ts"   # only the feature you changed
```

## 6. Commits

Format:

```
LYMON-XXX type(scope): description
```

- **type**: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`
- **scope**: the layer or feature you changed (`domain`, `infra`, `crm`, `cart`, …)
- **description**: lowercase, imperative ("add", not "added"), no trailing period

Examples:

```
LYMON-1108 refactor(domain): group the guest contracts under a guest folder
LYMON-1108 chore: use the @ alias for every import that leaves its own folder
```

Keep each commit to one change.

## 7. Open a pull request

```bash
git push -u origin LYMON-XXX-jira-item-name
```

Open the PR on GitHub:

- **Base branch:** `main`
- **Title:** `LYMON-XXX type(scope): description`
- **Description:** GitHub pre-fills it from [`.github/pull_request_template.md`](.github/pull_request_template.md). Add the Jira ID, list what changed as short bullets (add screenshots for UI changes), and tick the checklist.

Then move the Jira ticket from **In Progress** to **PR**.

**GitHub Actions** runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml) on every PR
to `main` and on every push to `main`. It has three jobs that run in sequence, each one only
if the previous one passed:

1. **`lint`**: `pnpm lint`
2. **`build`**: `pnpm run build`
3. **`test`**: `pnpm test --watch=false`

All three must be green before the PR can be merged. Pushing new commits to the PR cancels
the run still in progress. E2E tests are not part of CI; they will run against staging once
the deployment pipeline exists.

Making the checks required is a repository setting, not part of the workflow. An admin sets
it once in **Settings → Branches → Branch protection rule** for `main`: enable **Require
status checks to pass before merging** and select `lint`, `build` and `test`.

Netlify builds and deploys `main` with `ng build --configuration production`
([`netlify.toml`](netlify.toml)).

## 8. Review and merge

- You need **1 approval** from a teammate.
- Reply to or resolve every review comment. Push fixes to the same branch.
- Once the PR is approved and CI is green, **you** merge it with **Squash and merge** or
  **Rebase and merge**. Merge commits are not allowed, because `main` keeps a linear
  history.
  - **Squash**: the default. The whole PR becomes one commit on `main`, titled with the
    PR title.
  - **Rebase**: use it only when every commit on the branch is clean and follows the
    commit format, and each one is worth keeping on its own.
- Delete the branch after merging.

## Architecture decisions

If a change makes a significant design choice (a new pattern, library, state approach, or
folder rule), record it as a new numbered ADR in [`docs/adr/`](docs/adr/). Use the
existing ADRs as the template.
