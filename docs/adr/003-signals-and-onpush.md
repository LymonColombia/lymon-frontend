# ADR-003: Signals and OnPush for all component state

**Date:** 2026-03-02  
**Status:** Accepted

---

## Context

Angular 21 offers signals and signal inputs and outputs, next to the older decorators
(`@Input`, `@Output`) and default change detection.
Mixing both styles makes components harder to read and to review. Default change detection
also re-checks every component on any event, which gets slow on data-heavy pages such as
the CRM and the reservations list.

## Decision

- Every component uses `ChangeDetectionStrategy.OnPush`.
- Inputs and outputs use `input()`, `input.required()`, `model()` and `output()`. No
  decorators.
- Component state is held in `signal()` and derived with `computed()`. Templates read
  signals, not mutable fields.
- No global state library. Session state lives in root services that expose read-only
  signals (`TokenService.isAuthenticated`), and reactions to them use `effect()`.
- Data still arrives as `Observable`s from use cases. Pages subscribe with
  `takeUntilDestroyed()` and write the result into signals.
- Templates use native control flow (`@if`, `@for`, `@switch`) and direct `[class.x]`
  bindings.

The full rules are in [ui.md](../architecture/ui.md).

## Consequences

**Positive:**

- One style across the codebase, and reviews can reject the old one on sight.
- OnPush plus signals only re-renders what changed.
- No store means no extra library or boilerplate.

**Negative:**

- Shared state between pages has to go through a root service. If many features start
  sharing state, revisit this decision.
- Moving between `Observable` and signal in each page is a little repetitive.
