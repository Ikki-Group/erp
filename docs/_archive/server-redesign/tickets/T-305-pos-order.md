# T-305: `pos/order` module — **CRITICAL**

**Tracker row:** M.pos-order
**Depends on:** `inventory/stock` (T-301), `menu` (T-207), `company` (T-102), `payment-method` (T-206), `recipe` (T-208), `uom` (T-202), `material` (T-204), `pos/shift` (T-302), `pos/table` (T-303), `pos/voucher` (T-304)
**Type:** complex module (Layer 2) — carries the two P0 fixes

## Goal
The full order lifecycle with atomic stock deduction on complete and atomic sync-lines — the highest-risk module.

## Read first
- **[14-migrate-pos-order.md](../14-migrate-pos-order.md)** (mandatory — per-file plan + defect table)
- **[11-complex-module.md](../11-complex-module.md)** (§3 has `complete-order` verbatim)
- [04-value-objects.md](../04-value-objects.md) · [12-module-checklist.md](../12-module-checklist.md)

## Open decision
Tax stays a single company rate via `company.api.taxRate` (per-location tax out of scope — see [../18-progress.md](../18-progress.md)). Strict-stock (T-301) applies to completion.

## Build (per spec 14)
Use-cases (each in a UoW, audit inside): `create-order`, `sync-lines` (**P0-2**: delete+insert+update in one tx), `apply-voucher`, `remove-voucher`, `record-payment`, `complete-order` (**P0-1**: stock deduct + voucher increment + table status as atomic effects inside the tx; `OrderCompleted` event + cache after commit), `void-order`. Domain calculator on `Money`/`Qty`. `read/order-detail.query.ts`. Routes guarded by `pos-order.read/create/update/complete/void`.

## Definition of done (mandatory defect tests)
- **P0-1:** complete with insufficient stock ⇒ order stays `open`, no stock change (relies on T-301 strict-stock).
- **P0-2:** force line-insert failure in sync-lines ⇒ old lines intact.
- **P1-1:** user without `pos-order.complete` ⇒ 403.
- **P1-2:** audit row exists iff the op commits; `actorName` non-empty.
- **P2-1:** calculator unit tests.
- `bun run verify` + `bun run test` green; append descriptor to `ALL_MODULE_DESCRIPTORS`.

## Notes / gotchas
`layer: 2`. Build LAST in Phase 3-core (needs stock + all masters + pos siblings). Wire `deductStock` from `deps.inventory.api`, `taxRate` from `deps.company.api`, etc. (spec 11 §6). After completing this module, invalidate stock balance cache post-commit via `inventory.api.invalidateBalance`.
