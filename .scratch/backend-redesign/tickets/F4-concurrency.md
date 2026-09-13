# F4 · Concurrency & locking model

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: F2 ✅

## Resolution (2026-09-13)

**Decision:** Permissive, non-blocking model for a small UMKM. Negative stock allowed for sales (drop the non-negative CHECK); transfer-out still requires sufficient stock; opname snapshot-based (non-blocking); one-active invariants via partial unique index. Full decision in [`docs/adr/0006-concurrency-permissive-stock.md`](../../../docs/adr/0006-concurrency-permissive-stock.md).

Settled Q1–Q5:
- Owner principle: app must be smart and non-blocking; never demand stock discipline.
- Q1/Q4: negative stock allowed for sales — drop `stock_balances_qty_nonneg_chk`; sale deduction never fails on low stock; negative = restock signal. Transfer-out still checks; adjustments unrestricted. **Revises ADR-0002 §4.**
- Q2/Q5: opname snapshot-based, non-blocking (sales continue; variance vs snapshot).
- Q3: one-active invariants (shift/opname/order) via partial unique index (blocks impossible state, not normal ops); order-per-table exact shape resolved in POS module grilling.
- Concurrent deduction: `SELECT ... FOR UPDATE` for consistent weighted-avg-cost; negative balance no longer a race hazard.

Requires a DB migration to remove the CHECK constraint (implementation phase).

## Question

How does the backend handle concurrent operations that contend on the same data?

Press the concrete claims the PRDs make: opname blocks ALL stock movements at a location while `in_progress`; one open shift per cashier per location; one open order per table; stock quantity cannot go negative under concurrent deductions. Decide the mechanism (row locks, status guards, DB constraints, serialization) and whether these locks are realistic for a single-business scale. Output: an ADR defining the concurrency/locking approach.

## Notes

- Opname location-wide lock is a big concurrency claim — press whether it's needed or over-engineered for Ikki's scale.
- Depends on F2 (transaction model defines what a lock even means here).
