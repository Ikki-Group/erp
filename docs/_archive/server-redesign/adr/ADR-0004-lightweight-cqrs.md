# ADR-0004: Lightweight CQRS (No Projection Tables)

**Status:** Accepted
**Date:** 2026-09-05

## Context

Some reads are heavy or shaped very differently from the write model — order detail with joined lines/modifiers/payments, dashboard aggregates, reporting. In the current code these reads live inside the same service as writes, forcing the write model's shape onto reads and bloating services. We want cleaner reads without introducing a synchronization burden that a low-capability implementer would get wrong.

## Decision

Separate reads from writes **in code**: a `read/` folder holds `read-query` functions, distinct from `app/` write use-cases. Read-queries run their own optimized `SELECT` (may JOIN), map rows straight to a response DTO, never touch the domain layer or write-service, and never mutate.

Reads and writes **share the same tables**. There are **no** projection/denormalized tables that must be kept in sync.

## Alternatives Considered

- **Full CQRS with projection tables.** Rejected: every write would have to update a separate read table, and the implementer must remember to do so on every mutation — a permanent source of data drift. Not worth it at R&D stage.
- **No separation (reads in the write-service, as today).** Rejected: keeps services bloated and lets the write model leak into read shapes.

## Consequences

- **Easier:** read-queries are self-contained and independently optimizable; write use-cases shrink to mutations only. ~90% of the CQRS benefit at zero sync cost.
- **Harder:** a read shape and a write shape can drift from the underlying tables independently — but both read from the same source of truth, so they cannot disagree about the data itself.
- **Constraint:** read-queries are read-only by rule. If future reporting genuinely needs materialized projections, that is a new ADR superseding this one — not an ad-hoc addition.
