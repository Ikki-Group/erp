# T-207: `menu` module

**Tracker row:** M.menu
**Depends on:** `location` (T-201)
**Type:** complex module (Layer 1)

## Goal
The `menu` module: menu items, categories, modifier groups/options, exposing enriched item detail for `pos/order`.

## Read first
- [11-complex-module.md](../11-complex-module.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Complex: `category/`, `item/`, `modifier/`, `assignment/` sub-entities + `composed/` → `read/menu-item-detail.query.ts` (item with modifier groups + options). Prices are `Money`. Native boolean `isActive`. Expose:
- `api.itemDetail(id, cx?)` — item with base price + modifier groups/options, consumed by `pos/order.sync-lines`.

Routes for menu CRUD, guarded by `menu.*`.

## Definition of done
- CRUD for items/categories/modifiers; `itemDetail` returns the enriched shape via a read-query.
- Prices handled via `Money`.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 1`, `dependsOn: ['location']`. `itemDetail` is the read `pos/order` uses to price lines — keep it a read-query (spec 08), not a write-service.
