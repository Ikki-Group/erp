# D5 · Inventory domain (stock balance/movement, transfer, opname, receiving, min-stock)

`wayfinder:grilling` · HITL · status: **done** · claimed-by: agent (grilling session)
blocked-by: D3 ✅

## Resolution (2026-09-13)

**Decision:** `recordMovement` is the sole writer of stock balances; void reversal permissive & cost-neutral (FLAG #1); movement use-cases emit `StockMovementRecorded` for a future Finance subscriber (FLAG #5); transfer is ship + receive in two UoWs; opname snapshot-based; min-stock via event. Full decision in [`docs/adr/0011-inventory-domain.md`](../../../docs/adr/0011-inventory-domain.md).

Settled Q1–Q4:
- Q1: `recordMovement(input, tx)` sole balance writer — checks assignment (except permissive sale), computes weighted-avg, upserts balance, inserts immutable movement. This is the cross-module `Api(tx)`.
- Q2 [FLAG #1 closed]: void reversal = `return_in`, permissive (never fails), cost-neutral.
- Q3 [FLAG #5 closed]: emit `StockMovementRecorded` post-commit; no subscriber now (safe no-op); Finance subscribes later.
- Q4: transfer = ship (out, check source, capture cost) + receive (in, source_cost, permissive), two UoWs; in-transit goods in no balance.
- Opname snapshot-based (adjustments via recordMovement, cost-neutral); min-stock = cross-location sum via event.

## Question

Press: stock balance + immutable movement ledger; transfer request status flow (requested→in_transit→received) with source-cost capture; snapshot-based opname (ADR-0006); receiving (purchase UoM→storage UoM conversion + weighted-avg recalc); min-stock alert (sum across locations). Reconcile every movement type with permissive stock (ADR-0006) and the atomic model (ADR-0002).

## Notes

- Raw material: `docs/product/06-prd-inventory.md`, `03-prd-master-data-costing.md`. Existing (un-migrated, has P0-era code): `inventory/{stock,transfer,opname,receiving}`.
- This module exposes the atomic `deductForOrder(...tx)` effect POS depends on (D6) — its `Api(tx)` shape is decided here per ADR-0002.
- Depends on D3 (costing) since movements drive weighted-avg cost.

## Review flags (from foundation-ADR review, 2026-09-13)

- **[FLAG #1] Void stock reversal must be permissive.** ADR-0002 classifies "reverse stock on void" as an atomic effect that can fail→rollback, but ADR-0006 makes sales permissive. Adding stock back (void) must NEVER fail on quantity grounds (e.g. -3 → +2 is fine). Confirm void reversal follows the permissive rule (never blocks), unlike transfer-out.
- **[FLAG #5] Provide a journal event hook.** ADR-0002 marks financial journals "atomic in principle, out-of-scope now". To avoid re-opening finished modules when Finance is built later, movement-producing use-cases (receiving, adjustment, transfer) should emit a domain event Finance can subscribe to — design the hook now, don't wire Finance.
