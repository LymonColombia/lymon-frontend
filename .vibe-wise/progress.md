# Learning Progress

## CI pipeline (LYMON-1139)
- Learner proposed: replace Jenkins with GH Actions; PR runs lint → build → unit/integration tests → SonarQube; main runs similar; e2e placement undecided; playwright.yml open for discussion.
- Introduced (Claude explained): no linter exists yet; Sonar Community edition lacks PR analysis (SonarCloud/paid needed) and GH runners need a reachable Sonar server; current e2e tests deployed main, not PR code; Netlify deploy previews as option.

- Learner decided: SonarCloud (reuse token approach from backend CI); no e2e on every PR (cost); drop Docker image (learner plans to delete deprecated files separately); lint should not block merge.
- Introduced (Claude explained): angular-eslint (`ng add`) + optional prettier --check; non-blocking via continue-on-error vs non-required job; SonarCloud token/org/project key, disable Automatic Analysis, PR vs main analysis.

- Learner decided: angular-eslint, lint BLOCKS PRs (revised: non-blocking lint gets ignored); Sonar quality gate blocks merge; e2e runs on a staging environment before production; drop local-Sonar scoped workflow (Claude's interpretation: full `pnpm test` + coverage, rewrite sonar props for SonarCloud — awaiting confirmation).
- Introduced: staging branch (Git Flow-like) vs staging environment + promotion (GitHub Flow compatible); GitHub Environments; Netlify currently deploys main straight to prod.
- Flagged risk: first lint run on existing code likely many errors; cleanup scope undecided.

- Learner decided: staging = deployment step after merge to main (not a branch); prod promotion = e2e pass + manual approval (tentative, prod doesn't exist yet); staging backend exists; CD pipeline (not Netlify auto-deploy) decides deployment.

- Learner info: staging backend = https://lymon-backend-development.onrender.com (existing env files); staging frontend = lyhost.netlify.app (existing Netlify site). Dropped proposals: environment.staging.ts/angular.json config, Playwright baseURL env var.
- Learner asked (good risk spotting): will fixing lint in this ticket make Sonar flag low coverage? Introduced: Sonar way gate judges new code (changed lines) — coverage ≥80% on new code etc.

- Learner decided: lint setup + cleanup in this ticket; SonarCloud moved to a separate later ticket (lint fixes become part of Sonar baseline, avoiding new-code coverage failure). Demonstrated: sequencing changes to avoid a quality-gate side effect.

- Confirmed design: CI (PR + push main) lint → build → pnpm test, all blocking; CD on main: Netlify CLI deploy to staging (lyhost.netlify.app) → e2e; Sonar + prod promotion later tickets. One commit per step.
- Step 1 implemented (uncommitted): angular-eslint@21.4.0 (v22 incompatible with Angular 21), eslint.config.js defaults, `lint` target + `pnpm lint`. Result: 147 errors / 64 files; 21 auto-fixable. Top: label-has-associated-control 27, no-explicit-any 25, interactive-supports-focus 21, component-selector 15 (non-app prefixes in public catalog), click-events-have-key-events 10.

## Lint cleanup (LYMON-1139)
- Learner decided: fix all errors (no rule relaxing).
- Introduced: native button vs tabindex/role/keydown patch for clickable divs.
- Learner decided: clickable divs → native <button> (actions) or <a> (navigation).
- Learner asked for explanation of selector prefixes. Introduced: prefix = namespace to avoid collisions; repo has 96 app-, 14 feature-name prefixes in public/, 1 lyhost-, 4 unprefixed directives; rename risks CSS/e2e tag selectors.
- Needs reinforcement: why selector prefixes matter (learner didn't see the problem; re-explained as readability/ownership + low-risk collision avoidance, a convention rather than a bug).
- Learner decided: enforce app- prefix (rename 19) for consistency.

- Step 1 committed: 5d33cbc.
- Step 2 in progress (uncommitted): autofix, selectors renamed (app-*, appTutorialHighlight, appTenantPage*), TS errors fixed, labels fixed (for/id + controlComponents config for app-input/app-select/app-shift-date-picker), 3 profile menus + logo → button. 32 template errors remain. Build passes.
- Found: 182 unit tests (10 files) already fail on base commit — blocking `pnpm test` in CI would fail every PR.

## Remaining a11y + failing tests (LYMON-1139)
- Remaining categories: modal backdrops with (click) (modal.html, email-config); containers with only stopPropagation (guest-profile, notification-panel, inventory, email-config inner); wrappers with (keydown.escape) (reservation-list, wizard); <dialog> with stopPropagation (staff-shift x4).
- Learner asked for options on remaining a11y; Claude presented A (backdrop: presentation+Escape / sibling button / native dialog), B (stopPropagation containers: presentation / restructure), C (escape wrappers: presentation / host listener).
- Learner decided: fix the 182 failing tests ("otherwise it's not gonna work"). Root causes found: guest-profile missing CrmRepository provider (115), storage URL mismatch (22), login/register missing routes + stale messages (34), real network/timeouts (40), inventory inject context (4).
- Learner decided: A1 (presentation + Escape), B1 (presentation / explicit dialog role), C2 (host escape listener); fix tests in this ticket. No reasoning given for choices.
- Implemented: fb90557 (lint 0: presentation roles, host Escape handlers, removed dead dialog stopPropagation) and c40e7a7 (611/611 tests pass, exit 0). No test revealed a real app bug; all failures were stale specs (missing providers/routes, fetch vs HttpClient, deliberate UX changes LYMON-419/922, redesigned register form).

## CI workflow (LYMON-1139)
- Learner decided: separate jobs linked with `needs` (reason: better feedback, easier troubleshooting).
- Learner asked: does Netlify support env vars? Introduced: yes (per deploy context) but only at Netlify build time; Angular env is compile-time; with CLI deploy all secrets live in GitHub (NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID, MANAGER_EMAIL, MANAGER_PASSWORD). Also: separate jobs = fresh runners, need artifact passing.
- Learner revised scope: LYMON-1139 = CI only (lint, build, test); Sonar and CD (staging deploy, e2e, prod) are later tickets. Artifact passing and secrets deferred to CD.
- Learner decided: sequential lint → build → test (reason: no point testing if it doesn't build — fail fast); delete playwright.yml (fails on every PR).
- Implemented: e15f6b8 (ci.yml lint→build→test, playwright.yml deleted), f798462 (CONTRIBUTING + README). Verified locally: frozen install, lint, build, test 611/611 exit 0. Not yet run on GitHub; branch protection is a manual admin step.
- Demonstrated: fail-fast reasoning for job ordering; scope splitting (CI vs CD vs Sonar) into separate tickets.

## Branch strategy + Sonar placement (LYMON-1139)
- Learner proposed: merge 1139 into the 1143 docs branch; add Sonar to this branch (reverses earlier "Sonar in another ticket" decision).
- Introduced: stacked PRs (1139 → base 1143, retarget to main) vs merging feature branches; reminded that this branch's ~80 changed files would be Sonar "new code" → gate likely fails.
- Learner decided: keep Sonar in a separate ticket; stack PRs (1143 is draft PR #168).
- Done: branch pushed; draft PR #169 (base = 1143 branch). Note: origin "Lymonoficial" redirects to LymonColombia/lymon-frontend.
- Found: ci.yml triggers only on PRs targeting main → no checks on #169 until it is retargeted to main after #168 merges.
- Risk flagged: open PRs #165/#167 will hit the new lint/test gates and may conflict with selector renames.

## SonarCloud report on PR #169 (LYMON-1139)
- Learner reported: SonarCloud quality gate failed (duplication, security, reliability).
- Found: SonarCloud Automatic Analysis already installed (no CI step); not required (protect-main ruleset has empty required checks). CI lint/build/test passed on GitHub (Claude's earlier claim that CI wouldn't run on #169 was wrong).
- Causes: Security C = 3× S7637 actions not pinned to SHA in ci.yml; Reliability B = 5× mouse-event-without-keyboard on role="presentation" backdrops/containers (modal, email-config) — Sonar disagrees with angular-eslint; Duplication 5.2% (27/523) mainly profile button duplicated in catalog-nav/room-details-nav.
- Introduced: SHA pinning (mutable tags, supply chain), Automatic vs CI-based analysis, linter disagreement, A2 satisfies both.
- Docs bug: CONTRIBUTING says classic branch protection; repo uses Rulesets (protect-main).
- Learner decided: implement Sonar in this ticket (reverses the separate-ticket decision; reason: it's failing). Asked: difference between Automatic Analysis and token/CI-based.
- Introduced: comparison (who runs, coverage import only in CI-based, needs: test, must disable Automatic Analysis, config). Reminded: token setup adds coverage-on-new-code → this PR likely fails; sonar-project.properties is Jenkins-era (13 files, local lcov) and needs rewriting.
- Awaiting: Automatic vs CI-based; how to handle coverage on this PR. Still open: CONTRIBUTING ruleset wording fix.

## Next (not started)
- Push branch + open PR; confirm first CI run green; set branch protection (lint, build, test).
- Later tickets: SonarCloud; CD (Netlify CLI deploy to staging, artifact passing, e2e with MANAGER_* secrets, prod promotion with approval); delete Jenkinsfile/Dockerfile/nginx.conf.
