# ADR-0002: Explicit Unit of Work + Neon WebSocket Driver

**Status:** Accepted
**Date:** 2026-09-05

## Context

`infra/database/index.ts` defines `withTransaction(db, fn)` that **does not open a transaction** — it just calls `fn(db)`. The comment admits it: the `neon-http` driver does not support interactive transactions. As a result, every multi-statement operation in the codebase is non-atomic. Concrete failure: `OrderService.handleSyncLines` deletes all order lines, then inserts new ones, then updates totals — three separate statements. A failure after the delete leaves the order with no lines. This is a P0 data-integrity defect affecting the entire backend.

## Decision

1. Switch the DB driver from `drizzle-orm/neon-http` to `drizzle-orm/neon-serverless` (WebSocket), which supports real interactive transactions via `db.transaction()`.
2. Introduce an explicit **Unit of Work** abstraction (`UnitOfWork` port with a `run(fn(tx))` method) that a write use-case opens exactly once. Every repo method accepts the transaction handle (`tx`) as its DB context. All writes and atomic effects in a use-case share one transaction and commit/roll back together.

## Alternatives Considered

- **Keep `neon-http`, emulate atomicity in application code (sagas/compensation).** Rejected: compensation logic is exactly the kind of subtle, branch-heavy code a low-capability model gets wrong; and it cannot give true all-or-nothing semantics.
- **Move off Neon to a direct Postgres connection pool.** Rejected: unnecessary infra change; Neon serverless WebSocket already provides transactions. Left open as a future option behind the same UoW port.
- **Implicit transaction per request (middleware-managed).** Rejected: hides the boundary from the use-case; the implementer should see exactly where the transaction opens and closes.

## Consequences

- **Easier:** correctness — insufficient stock or a failed audit rolls the whole operation back. The implementer wraps writes in one visible `uow.run(async (tx) => { ... })` block.
- **Harder:** every repo signature carries `tx`. Mitigated: the golden-path template shows the exact signature; it is mechanical.
- **Constraint:** read-queries do not need a UoW. Only write use-cases open one.
- **Migration note:** connection setup changes (WebSocket constructor). Specified in Stage 2 transaction spec.
