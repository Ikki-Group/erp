# F2 · Transaction & atomic-effect model

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: F1

## Question

What is the transaction boundary model, and which cross-module effects must be atomic vs deferred?

Press the classification rule: which effects MUST commit-or-rollback with the main operation (e.g. stock deduction on order complete, journal entry, voucher increment, audit) and which MAY lag (notifications, cache, reporting). Decide the mechanism for atomic cross-module effects (port threaded with `tx`) vs deferred (event after commit). This directly fixes the live P0 (fire-and-forget stock deduction). Output: an ADR defining the UoW model and the atomic-vs-deferred decision rule.

## Notes

- Live P0: order marked completed + committed, THEN stock deducted fire-and-forget with errors swallowed.
- Old ADR-0002/0003 (UoW + hybrid cross-module) are strong raw material — press them, don't assume.
- Depends on F1 (module standard defines where use-cases/services live).
