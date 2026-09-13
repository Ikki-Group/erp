# ADR-0003: Hybrid Cross-Module Communication

**Status:** Accepted
**Date:** 2026-09-05

## Context

Modules must trigger effects in other modules (e.g. completing an order deducts inventory stock, writes an audit log, and could send a notification). The current code injects services directly and calls them — but the critical stock deduction is fire-and-forget after the order is already committed, so a deduction failure silently corrupts stock (P0). We need one clear rule for how modules communicate that both fixes atomicity and stays followable by a low-capability implementer.

## Decision

Use a **hybrid** model with a single mechanical rule:

> **Effect must roll back with the operation → call it synchronously inside the Unit of Work, passing the transaction `tx`.**
> **Effect may fail or lag independently → publish an in-process domain event after commit; the other module subscribes.**

- **Atomic effects** (stock deduction, voucher usage increment, audit) are synchronous calls to the other module's app-layer use-case/port, inside the same UoW.
- **Non-critical effects** (notifications, dashboard cache refresh, analytics) are domain events published after commit, handled by subscribers via an in-process event bus.

## Alternatives Considered

- **Full domain-events everywhere.** Rejected: creates action-at-a-distance — the implementer sees `emit(OrderCompleted)` with no visible indication that stock is deducted elsewhere. Worse, async event handlers do not share the transaction, so the P0 atomicity bug returns.
- **Full synchronous explicit calls everywhere.** Rejected: forces trivial effects (audit, notification) into the critical transaction path; a notification failure could roll back a sale. Rigid and misplaced coupling.
- **Message broker (Kafka/SQS).** Rejected: no external broker at this stage; in-process pub/sub is sufficient for a single deployment.

## Consequences

- **Easier:** the atomic path is visible in one place (the use-case body), directly fixing the P0. The sync-vs-event decision is a one-line rule the implementer applies without judgement, backed by the classification table in `01-architecture.md`.
- **Harder:** two mechanisms instead of one. Mitigated by the explicit rule and a fixed classification table — the implementer never decides, only looks up.
- **Constraint:** domain events are published **after** commit and never carry a `tx`. Event handlers must be idempotent and must not be relied upon for atomic correctness. Specified in Stage 2 event-bus spec.
