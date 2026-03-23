# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server
npm run build      # Production build
npm test           # Run all tests (Vitest via Angular CLI)
npm run watch      # Dev build with file watching
```

There is no built-in command to run a single test file. To run a focused test, use `fit()` / `fdescribe()` in the spec file, then run `npm test`.

## Architecture

This project follows **Clean Architecture** with three strict layers:

### `src/app/domain/`
Pure business logic — no framework dependencies.
- `entities/` — business models (TypeScript interfaces/types)
- `repositories/` — abstract repository interfaces (contracts only)
- `use-cases/` — application business rules, each as an injectable Angular service organized by feature (auth, crm, guest, incident, property, reservation, staff, etc.)

### `src/app/infrastructure/`
Implements the domain contracts.
- `repositories/` — concrete HTTP implementations with `.impl.ts` suffix
- `mappers/` — transforms external DTOs ↔ domain entities
- `services/` — API utilities
- `guards/` — route guards
- `interceptors/` — HTTP interceptors

### `src/app/presentation/`
UI only — orchestrates domain use cases via Angular signals.
- `features/` — feature modules (auth, dashboard, guest-auth, hotel/*)
- `shared/components/` — dumb/presentational components that only accept `@Input` and emit `@Output`

Pages (smart components) call use cases directly and manage state with Angular signals. Shared components have no service dependencies.

## Key Conventions

- **All code must be in English** — variables, functions, classes, comments.
- **Path alias**: `@/` maps to `src/app/`, `@env` maps to `src/environments/environment`.
- **File naming**: `{feature}-{action}.use-case.ts`, `{domain}.repository.ts` (interface), `{domain}.repository.impl.ts` (implementation), `{domain}.mapper.ts`.
- **State management**: Angular signals for reactive state; RxJS observables for async operations.
- **Commit format**: Conventional Commits — `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `style:`, `chore:` with a short English description.

## Testing Patterns

Tests use Vitest with Angular's `TestBed`. The standard pattern:

```typescript
// Mock use cases via TestBed providers
providers: [
  { provide: SomeUseCase, useValue: { execute: vi.fn() } }
]
// Assertions use Angular signals
expect(component.someSignal()).toBe(expectedValue);
// Cleanup
vi.clearAllMocks();
```

HTTP errors (401, 403, 404, 500) are explicitly tested in each component/use case.
