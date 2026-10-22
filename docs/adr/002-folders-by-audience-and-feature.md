# ADR-002: Folders by audience, then by feature

**Date:** 2026-08-27  
**Status:** Accepted

---

## Context

Each layer started flat: `domain/entities/`, `domain/repositories/`, `domain/use-cases/`,
and similar folders in infrastructure. With about 25 repositories and almost 90 use cases,
finding everything that belongs to one feature meant searching through every folder.
Staff and guest code with similar names (`reservation` and `guest-reservation`,
`auth` and `guest-auth`) also sat side by side, which hid which audience a file served.

## Decision

Organise every layer by **audience**, then by **feature**, with the same feature name in
every layer (LYMON-1108):

```
src/app/domain/<audience>/<feature>/            <feature>.model.ts, <feature>.repository.ts, use-cases/
src/app/infrastructure/<audience>/<feature>/    <feature>.dto.ts, <feature>.mapper.ts, <feature>.repository.impl.ts
src/app/presentation/<audience>/features/<feature>/pages/
```

- Audiences are `tenant` (staff and owners), `guest`, and `shared` for contracts both use
  (`property`, `reservation`, `plan`). Presentation also has `public/` for the catalog.
- Guards, interceptors and token services live under the audience they protect
  (`infrastructure/tenant/guards/`, `infrastructure/guest/interceptors/`).
- DTOs are named after the repository they serve and sit next to it.
- Every import that leaves its own folder uses the `@/` alias.

The layer boundaries from [ADR-001](001-clean-architecture.md) don't change. Only the
folders inside each layer move.

## Consequences

**Positive:**

- One feature is three folders, and the path says which audience it serves.
- Adding a feature doesn't touch shared folders, which reduces merge conflicts.

**Negative:**

- Deciding between `tenant/` and `shared/` is a judgement call. Move a contract to
  `shared/` only when both audiences actually use it.
- Paths are longer, and the Sonar and coverage configs list files by path, so they have to
  be updated when files move.
