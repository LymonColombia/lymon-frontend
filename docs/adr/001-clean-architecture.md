# ADR-001: Clean Architecture in three layers

**Date:** 2026-01-23  
**Status:** Accepted

---

## Context

The frontend serves three audiences (staff, guests, visitors) over a backend whose
contracts were still changing. Without a boundary, `HttpClient` calls, response shapes and
business rules would end up inside components, so every backend rename would touch many
pages, and nothing could be tested without a backend.

## Decision

Split `src/app/` into three layers, and only let dependencies point toward `domain/`:

```
src/app/
  domain/          ← Models, repositories as abstract classes, use cases. No HttpClient, no DTOs.
  infrastructure/  ← Repository implementations (HTTP), DTOs, mappers, interceptors, guards.
  presentation/    ← Pages, components, routes. They call use cases.
```

- A repository contract is an **abstract class**, not an interface, so Angular can use it
  as a DI token without an `InjectionToken`.
- Each contract is bound to its implementation in `app.config.ts`:
  `{ provide: CrmRepository, useClass: CrmRepositoryImpl }`.
- A use case is an `@Injectable({ providedIn: 'root' })` class with one public
  `execute()` method that returns an `Observable`.
- Mappers turn API DTOs into domain models inside `infrastructure/`. The domain never sees
  a DTO.

## Consequences

**Positive:**

- Use cases are tested with a mocked repository, and repository implementations with
  `HttpTestingController`. Neither needs a backend.
- A backend response change touches one DTO and one mapper.
- Pages stay focused on state and rendering.

**Negative:**

- One endpoint costs up to six files (model, contract, use case, DTO, mapper, impl) plus a
  binding. Forgetting the binding only fails at runtime (`No provider for XRepository`).
- Simple pass-through use cases feel like boilerplate.
