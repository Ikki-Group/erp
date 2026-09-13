# T-208: `recipe` module

**Tracker row:** M.recipe
**Depends on:** `material` (T-204), `uom` (T-202), `menu` (T-207)
**Type:** simple module (Layer 1)

## Goal
The `recipe` module: recipes + recipe_lines (menu item → materials BOM), exposing the lookups `inventory/stock` deduction needs.

## Read first
- [10-simple-module.md](../10-simple-module.md) (+ sub-folder for `recipe_lines`) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist. `recipe_lines` sub-entity (materialId, quantity as `Qty`, uomId). Recipe has `yieldQty` (`Qty`) and native boolean `isActive`. Expose:
- `api.activeByMenuItem(menuItemId, cx?)` — the active recipe for a menu item.
- `api.linesByRecipe(recipeId, cx?)` — its lines.

Both consumed by `inventory/stock` deduction inside the order tx.

Routes for recipe CRUD, guarded by `recipe.*`.

## Definition of done
- CRUD for recipes + lines; the two `api` lookups return correct data and accept a `cx`.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 1`, `dependsOn: ['material','uom','menu']`. The `api` methods must accept `cx` so stock deduction reads them inside the order transaction.
