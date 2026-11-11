# T-303: `pos/table` module

**Tracker row:** M.pos-table
**Depends on:** `location` (T-201)
**Type:** simple module (Layer 2)

## Goal
Dine-in table management, exposing `api.updateStatus(tableId, status, tx)` — an atomic effect called inside `pos/order` create/complete/void.

## Read first
- [10-simple-module.md](../10-simple-module.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist. Entity `tables`; native boolean `isActive`; status enum `available/occupied/reserved`. CRUD use-cases. Expose:
- `api.updateStatus(tableId, status, tx): Promise<void>` — takes `tx` (atomic effect for order flows).

Routes guarded by `pos-table.*`.

## Definition of done
- CRUD; `updateStatus` accepts a `tx` and updates within it.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 2`, `dependsOn: ['location']`. `updateStatus` MUST take `tx` so table status flips atomically with order create/complete/void (spec 14).
