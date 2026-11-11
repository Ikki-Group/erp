# T-204: `material` module

**Tracker row:** M.material
**Depends on:** `uom` (T-202), `location` (T-201)
**Type:** medium module (Layer 1)

## Goal
The `material` module: materials + categories + per-location assignments, exposing `api.isAssigned` used by `inventory/stock`.

## Read first
- [10-simple-module.md](../10-simple-module.md) (+ sub-folder pattern from [11](../11-complex-module.md)) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Medium: `category/` and `assignment/` sub-folders alongside the main material files. Material has `baseUomId` (→ uom). Native boolean `isActive`. Expose:
- `api.getById(id, cx?)` (with `baseUomId`) — consumed by stock deduction.
- `api.assignment.isAssigned(materialId, locationId, cx?)` — consumed by `inventory/stock` (inside its tx).

Routes for material/category/assignment CRUD, guarded by `material.*`.

## Definition of done
- CRUD for materials, categories, assignments; `isAssigned` correct.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 1`, `dependsOn: ['uom','location']`. `isAssigned` must accept a `cx` so `inventory/stock` can call it inside the order transaction.
