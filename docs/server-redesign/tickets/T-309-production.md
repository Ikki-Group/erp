# T-309: `production` module

**Tracker row:** M.production
**Depends on:** `material` (T-204), `inventory/stock` (T-301), `uom` (T-202)
**Type:** complex-ish module (Layer 2)

## Goal
Semi-finished item production; completing a production order deducts input materials and adds the output, atomically.

## Read first
- [11-complex-module.md](../11-complex-module.md) · [15-migrate-inventory-stock.md](../15-migrate-inventory-stock.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Entities `production_recipes` + `production_recipe_lines` + `production_orders` (`Qty` fields; native boolean `isActive` on recipes). Use-cases: production-recipe CRUD, `createProductionOrder`, `completeProductionOrder` — in ONE UoW: for each input line `recordMovement(out, tx)`, then `recordMovement(in, tx)` for the produced output (with computed cost). All via `inventory.api.recordMovement(..., tx)`. Audit inside; invalidate balances post-commit.

Routes guarded by `production.*` (incl. `.complete`).

## Definition of done
- Recipe + order CRUD; complete deducts inputs and adds output atomically (force failure ⇒ nothing moved, order not completed).
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 2`, `dependsOn: ['material','inventory','uom']`. Inputs and output move in the SAME transaction — a shortfall on any input (strict-stock) rolls the whole production back. UoM conversion via `uom.api`.
