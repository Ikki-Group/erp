# F2 · Transaction & atomic-effect model

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: F1 ✅

## Resolution (2026-09-13)

**Decision:** Ratify the hybrid effect model — atomic effects run synchronously inside one UoW threading `tx`; non-critical effects publish as best-effort in-process domain events after commit. Full decision in [`docs/adr/0002-transaction-atomic-effects.md`](../../../docs/adr/0002-transaction-atomic-effects.md).

Settled Q1–Q6:
- Q1: hybrid rule ratified (consolidates archived ADR-0002/0003).
- Q2: Ikki effect classification table — atomic: stock deduct, voucher, void-reversal, transfer cost+stock, opname adjustment, audit, (journal in principle, Finance out-of-scope); non-critical events: table status, notification, min-stock; cache post-commit.
- Q3: one write = one UoW at top-most service; cross-module atomic effects via `Api` methods that must accept `tx`; no nested transactions.
- Q4: failing atomic effect must throw a specific domain error (→409); no error-swallowing inside UoW.
- Q5: best-effort in-process event bus, idempotent handlers; outbox deferred until an un-loseable non-critical effect appears.
- Q6: mandatory in-UoW ordering (load→rules→compute→persist→atomic effects→audit), then post-commit (publish events→invalidate cache).

## Question

What is the transaction boundary model, and which cross-module effects must be atomic vs deferred?

Press the classification rule: which effects MUST commit-or-rollback with the main operation (e.g. stock deduction on order complete, journal entry, voucher increment, audit) and which MAY lag (notifications, cache, reporting). Decide the mechanism for atomic cross-module effects (port threaded with `tx`) vs deferred (event after commit). This directly fixes the live P0 (fire-and-forget stock deduction). Output: an ADR defining the UoW model and the atomic-vs-deferred decision rule.

## Notes

- Live P0: order marked completed + committed, THEN stock deducted fire-and-forget with errors swallowed.
- Old ADR-0002/0003 (UoW + hybrid cross-module) are strong raw material — press them, don't assume.
- Depends on F1 (module standard defines where use-cases/services live).
