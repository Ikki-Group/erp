# T-205: `supplier` module

**Tracker row:** M.supplier
**Depends on:** `material` (T-204), `uom` (T-202)
**Type:** simple module (Layer 1)

## Goal
The `supplier` module: suppliers + supplier_materials (per-material pricing).

## Read first
- [10-simple-module.md](../10-simple-module.md) (+ sub-folder for `supplier_materials`) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist. `supplier_materials` pricing is a sub-entity (medium-ish); prices are `Money`. Native boolean `isActive`. Expose `api.getById` if consumed (receiving links to supplier).

Routes for supplier + supplier-material CRUD, guarded by `supplier.*`.

## Definition of done
- CRUD for suppliers + material pricing; prices handled via `Money`.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 1`, `dependsOn: ['material','uom']`. Consumed later by `inventory/receiving`.
