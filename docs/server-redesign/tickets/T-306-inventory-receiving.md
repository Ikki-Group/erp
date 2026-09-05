# T-306: `inventory/receiving` module

**Tracker row:** M.inv-receiving
**Depends on:** `material` (T-204), `supplier` (T-205), `inventory/stock` (T-301)
**Type:** complex-ish module (Layer 2)

## Goal
Goods receipt from suppliers; confirming a receiving creates `in` stock movements atomically.

## Read first
- [11-complex-module.md](../11-complex-module.md) · [15-migrate-inventory-stock.md](../15-migrate-inventory-stock.md) (movement API) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Entities `receivings` + `receiving_lines` (sub-entity; `quantity` `Qty`, `unitCost` `Money`). Status enum `draft/confirmed`. Use-cases: `createReceiving`/`updateLines` (draft), `confirmReceiving` — the confirm runs in a UoW and for each line calls `inventory.api.recordMovement({ direction: 'in', unitCost, ... }, actorId, tx)` (atomic — weighted-avg cost updates inside the tx). Audit inside. Invalidate stock balance cache post-commit.

Routes guarded by `inventory-receiving.*` (incl. `inventory-receiving.confirm`).

## Definition of done
- Draft CRUD; confirm creates movements atomically (force a movement failure ⇒ receiving stays draft, no balance change).
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 2`, `dependsOn: ['material','supplier','inventory']`. Movements go through stock's `recordMovement` with the confirm tx — never write stock tables directly.
