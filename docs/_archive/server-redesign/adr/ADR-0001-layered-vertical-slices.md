# ADR-0001: Deepened Per-Module Layers

**Status:** Accepted
**Date:** 2026-09-05

## Context

The current backend uses vertical-slice modules with flat files (`{module}.contract.ts`, `.repo.ts`, `.service.ts`, `.route.ts`). Business logic, orchestration, and I/O all live in the service file. This mixes pure rules (computable, testable) with database access and transaction handling, making services large (the POS order service is ~450 lines) and hard to reason about — especially for a low-capability implementer who must hold the whole file in mind.

## Decision

Split each module into five layer folders with strictly inward dependencies:

- `domain/` — pure business logic (entities, invariants, rule functions). No I/O.
- `app/` — use-cases + port interfaces. Owns the transaction boundary.
- `infra/` — adapters implementing ports (Drizzle repos, cache, events).
- `contract/` — Zod DTOs (HTTP boundary).
- `http/` — thin Elysia routes.
- `read/` — optional read-queries (lightweight CQRS).

Dependencies point inward (`http → app → domain`; `infra → app`). The app layer depends on ports, never concrete adapters.

## Alternatives Considered

- **Keep flat files (current).** Rejected: mixing rules with I/O is the root of the current service bloat and the fire-and-forget bugs. It also gives the implementer no clear place to put each kind of code.
- **Full Clean/Onion architecture with a separate shared domain package.** Rejected: too much ceremony for a single-tenant app at R&D stage, and cross-package imports confuse a low-capability model.

## Consequences

- **Easier:** each file has one job; a use-case reads top-to-bottom; domain rules are unit-testable without a DB. The implementer always knows which folder a piece of code belongs in.
- **Harder:** more files per module. Mitigated by Stage 3 golden-path templates that make each module a copy-paste of a known shape.
- **Constraint:** the implementer must respect the import direction. Enforced by the dependency-rule table in `01-architecture.md` and by `check-deps` in the verify gate.
