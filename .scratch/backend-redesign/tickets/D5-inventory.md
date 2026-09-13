# D5 · Inventory domain (stock balance/movement, transfer, opname, receiving, min-stock)

`wayfinder:grilling` · HITL · status: open · claimed-by: —
blocked-by: D3

## Question

Press: stock balance + immutable movement ledger; transfer request status flow (requested→in_transit→received) with source-cost capture; snapshot-based opname (ADR-0006); receiving (purchase UoM→storage UoM conversion + weighted-avg recalc); min-stock alert (sum across locations). Reconcile every movement type with permissive stock (ADR-0006) and the atomic model (ADR-0002).

## Notes

- Raw material: `docs/product/06-prd-inventory.md`, `03-prd-master-data-costing.md`. Existing (un-migrated, has P0-era code): `inventory/{stock,transfer,opname,receiving}`.
- This module exposes the atomic `deductForOrder(...tx)` effect POS depends on (D6) — its `Api(tx)` shape is decided here per ADR-0002.
- Depends on D3 (costing) since movements drive weighted-avg cost.
