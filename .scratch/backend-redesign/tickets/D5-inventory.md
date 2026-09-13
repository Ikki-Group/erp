# D5 · Inventory domain (stock balance/movement, transfer, opname, receiving, min-stock)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: D3

## Question

Press: stock balance + immutable movement ledger; transfer request status flow (requested→in_transit→received) with source-cost capture; snapshot-based opname (ADR-0006); receiving (purchase UoM→storage UoM conversion + weighted-avg recalc); min-stock alert (sum across locations). Reconcile every movement type with permissive stock (ADR-0006) and the atomic model (ADR-0002).

## Notes

- Raw material: `docs/product/06-prd-inventory.md`, `03-prd-master-data-costing.md`. Existing (un-migrated, has P0-era code): `inventory/{stock,transfer,opname,receiving}`.
- This module exposes the atomic `deductForOrder(...tx)` effect POS depends on (D6) — its `Api(tx)` shape is decided here per ADR-0002.
- Depends on D3 (costing) since movements drive weighted-avg cost.

## Review flags (from foundation-ADR review, 2026-09-13)

- **[FLAG #1] Void stock reversal must be permissive.** ADR-0002 classifies "reverse stock on void" as an atomic effect that can fail→rollback, but ADR-0006 makes sales permissive. Adding stock back (void) must NEVER fail on quantity grounds (e.g. -3 → +2 is fine). Confirm void reversal follows the permissive rule (never blocks), unlike transfer-out.
- **[FLAG #5] Provide a journal event hook.** ADR-0002 marks financial journals "atomic in principle, out-of-scope now". To avoid re-opening finished modules when Finance is built later, movement-producing use-cases (receiving, adjustment, transfer) should emit a domain event Finance can subscribe to — design the hook now, don't wire Finance.
