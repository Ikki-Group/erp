# T-304: `pos/voucher` module

**Tracker row:** M.pos-voucher
**Depends on:** Phase 0
**Type:** simple module (Layer 2)

## Goal
Discount voucher codes, exposing `api.validate(code, subtotal)` and `api.increment(voucherId, tx)` for `pos/order`.

## Read first
- [10-simple-module.md](../10-simple-module.md) · [12-module-checklist.md](../12-module-checklist.md)

## Build
Follow the checklist. Entity `vouchers`; `value`/`minPurchase`/`maxDiscount` are `Money`; native boolean `isActive`; type enum `percentage/fixed`. CRUD + expose:
- `api.validate(code, subtotal): { valid, discountAmount, reason? }` — validity window, usage limit, min purchase; discount computed via `Money`.
- `api.increment(voucherId, tx): Promise<void>` — atomic effect (usage count++) called inside order complete.

Routes guarded by `pos-voucher.*`.

## Definition of done
- CRUD; `validate` handles window/limit/min-purchase; `increment` takes `tx`.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 2`, `dependsOn: []`. `increment` MUST take `tx` (atomic with order complete, spec 14). Discount math uses `Money`, not `Number`.
