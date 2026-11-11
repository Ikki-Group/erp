# T-308: `inventory/opname` module

**Tracker row:** M.inv-opname
**Depends on:** `material` (T-204), `inventory/stock` (T-301)
**Type:** complex-ish module (Layer 2)

## Goal
Physical stock count reconciliation; completing an opname posts adjustment movements atomically.

## Read first
- [11-complex-module.md](../11-complex-module.md) · [15-migrate-inventory-stock.md](../15-migrate-inventory-stock.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Entities `stock_opnames` + `stock_opname_lines` (`systemQty`, `actualQty` as `Qty`). Status enum `draft/in_progress/completed/cancelled`. Use-cases: `createOpname`, `updateLines` (record counts), `completeOpname` — in a UoW, for each line with a variance post an adjustment movement (`in` or `out`, `type: 'adjustment'`) via `inventory.api.recordMovement(..., tx)`. Audit inside; invalidate balances post-commit.

Routes guarded by `inventory-opname.*` (incl. `.complete`).

## Definition of done
- Count workflow; complete posts adjustments atomically (force failure ⇒ opname not completed, no partial adjustment).
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 2`, `dependsOn: ['material','inventory']`. Adjustments go through `recordMovement` with the complete tx. An adjustment that would drive balance negative follows strict-stock (throws).
