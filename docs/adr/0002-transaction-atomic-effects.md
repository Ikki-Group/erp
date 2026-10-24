# ADR-0002: Transaction Boundary & Atomic-Effect Model

**Status:** Accepted
**Date:** 2026-09-13
**Supersedes:** archived `ADR-0002-unit-of-work-neon-websocket.md` and `ADR-0003-hybrid-cross-module.md` (consolidated and re-grilled here).
**Depends on:** ADR-0001 (module standard).

## Context

Write operations frequently trigger effects in other modules: completing an order deducts inventory stock, increments voucher usage, and writes an audit record. The live P0 is that stock deduction runs **fire-and-forget after the order is already committed**, with errors swallowed by `logger.warn` — so a deduction failure silently corrupts stock and the user never learns.

We need one mechanical rule for transaction boundaries and cross-module effects that fixes atomicity and is followable by the implementer (GPT-Luna). A real transaction primitive already exists: `UnitOfWork.run(fn)` (`apps/server/src/shared/uow/uow.port.ts`), backed by `db.transaction` (Neon WebSocket). It does **not** handle nested transactions, which shapes the cross-module rule below.

## Decision

### 1. Hybrid effect rule

> **Effect must roll back with the operation → call it synchronously inside the Unit of Work, threading the transaction `tx`.**
> **Effect may fail or lag independently → publish an in-process domain event after commit; another module subscribes.**

### 2. Effect classification (Ikki core operations)

| Effect | Trigger | Class |
| --- | --- | --- |
| Deduct inventory stock | order complete | **Atomic** (fixes the P0) |
| Increment voucher usage | order complete | **Atomic** |
| Reverse stock | order/line void | **Atomic** |
| Transfer: capture source cost + add destination stock | transfer received | **Atomic** |
| Opname: create adjustment movements | opname complete | **Atomic** |
| Write audit record | every mutation | **Atomic** (awaited in tx; fidelity per ADR for F6) |
| Post financial journal | complete / void / receiving | **Atomic in principle** — Finance is out of scope for this map. To avoid re-opening finished modules later, journal-triggering use-cases emit a domain event now that Finance will subscribe to; the atomic posting itself is built with Finance. |
| Update table status | order complete / void | **Non-critical** — domain event (a wrong table status is manually correctable) |
| Notification / min-stock alert | various | **Non-critical** — domain event |
| Invalidate cache | every write | **Post-commit** (not a domain effect; always after commit) |

### 3. One write = one UoW; no nested transactions

- A write operation opens **exactly one** UoW, at the top-most service `handle*` method.
- Cross-module atomic effects are exposed on the neighbour module's `Api` as methods that **must accept `tx`** (e.g. `inventoryApi.deductForOrder(order, lines, actor, tx)`). The called module **never opens its own UoW** for an effect — it uses the caller's `tx`.
- Every repo method threads `tx` (per ADR-0001). This avoids nested transactions entirely, since `uow.run` maps straight to `db.transaction` with no savepoint join.

### 4. Failure behaviour: never swallow inside the UoW

> **Revised by ADR-0006:** sale/recipe stock deduction is exempt from the throw-on-insufficiency rule below — under the permissive-stock model it never fails on low stock and may go negative. The rule still applies to transfer-out and to genuine errors (material not found, DB failure).

- A failing atomic effect **must throw a specific domain error** carrying context (e.g. `insufficientStock(materialId, needed, available)`), which surfaces as HTTP **409 Conflict**.
- Inside `uow.run`, a `try/catch` that swallows an error is **forbidden** — let it throw so the transaction rolls back and the user learns exactly why. This is the direct inversion of the legacy fire-and-forget bug.

### 5. Event bus: best-effort in-process

- Non-critical effects are published as domain events **after** commit, handled in-process. A handler failure is logged, not retried; handlers must be **idempotent**.
- Events never carry a `tx` and are never relied on for atomic correctness.
- **No transactional outbox now.** If a non-critical effect is later found to be un-loseable, that is the trigger to introduce an outbox — not before.

### 6. Mandatory ordering inside a write `handle*`

Inside `uow.run(async (tx) => { ... })`:

1. **Load** entities via repo (`tx`)
2. **Rules** — pure `assert*` guards
3. **Compute** — pure calculator (Money/Qty)
4. **Persist** — repo writes (`tx`)
5. **Atomic effects** — call other modules' `Api` with `tx`
6. **Audit** — record within `tx`

After `uow.run` returns (outside the transaction):

7. **Publish** domain events (non-critical)
8. **Invalidate** cache

The two rules most often broken, stated explicitly: events and cache invalidation are **never** inside the tx; atomic effects are **never** after commit.

## Alternatives Considered

- **Domain events for everything.** Rejected: async handlers don't share the transaction, so the P0 returns; also hides the atomic path.
- **Synchronous calls for everything.** Rejected: forces trivial effects (notification) into the critical path — a notification failure could roll back a sale.
- **Transactional outbox now.** Rejected: too much ceremony for single-business scale at this stage; revisited only if an un-loseable non-critical effect appears.

## Consequences

- **Easier:** the atomic path is visible in one place (the `handle*` body); the sync-vs-event choice is a table lookup, not a judgment call.
- **Harder:** two mechanisms (UoW + event bus) coexist. Mitigated by the fixed classification table and mandatory ordering.
- **Constraint:** cross-module atomic effects must be `Api` methods that accept `tx`; no module opens a second UoW; no error-swallowing inside a UoW. Verified by review and integration tests proving rollback (test mechanism specified alongside module work).
