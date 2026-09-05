# T-307: `inventory/transfer` module

**Tracker row:** M.inv-transfer
**Depends on:** `material` (T-204), `inventory/stock` (T-301)
**Type:** complex-ish module (Layer 2)

## Goal
Inter-location stock transfers; shipping/receiving create paired `out`/`in` movements atomically.

## Read first
- [11-complex-module.md](../11-complex-module.md) · [15-migrate-inventory-stock.md](../15-migrate-inventory-stock.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Entities `transfer_requests` + `transfer_lines` (`Qty` fields). Status enum `requested/in_transit/received/cancelled`; DB CHECK `from != to`. Use-cases: `createTransfer`, `shipTransfer` (out-movements at source, in one UoW), `receiveTransfer` (in-movements at destination, one UoW), `cancelTransfer`. Each movement via `inventory.api.recordMovement(..., tx)`. Audit inside; invalidate balances post-commit.

Routes guarded by `inventory-transfer.*` (incl. `.ship`, `.receive`, `.cancel`).

## Definition of done
- State transitions valid; ship/receive create movements atomically (force failure ⇒ no partial movement, status unchanged).
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 2`, `dependsOn: ['material','inventory']`. Out at source must respect strict-stock (throws if insufficient, rolls back the ship).
