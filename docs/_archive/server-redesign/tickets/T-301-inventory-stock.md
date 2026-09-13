# T-301: `inventory/stock` module — **CRITICAL**

**Tracker row:** M.inv-stock
**Depends on:** `material` (T-204), `recipe` (T-208), `uom` (T-202)
**Type:** complex module (Layer 2) — carries P0 fixes

## Goal
The transactional, race-safe stock engine, exposing `api.recordMovement(input, actorId, tx)` and `api.deductStock.deductForOrder(order, lines, actorId, tx)` used by `pos/order` and other operations.

## Read first
- **[15-migrate-inventory-stock.md](../15-migrate-inventory-stock.md)** (mandatory — the full spec incl. code)
- [11-complex-module.md](../11-complex-module.md) · [04-value-objects.md](../04-value-objects.md) · [12-module-checklist.md](../12-module-checklist.md)

## Open decision (resolve before building `deductForOrder`)
**Strict-stock vs permissive.** Spec 15 assumes strict: a movement `out` with insufficient stock throws `StockError.insufficientStock`, rolling back the caller's transaction. Confirm with the product owner (tracked in [../18-progress.md](../18-progress.md) Open decisions). Do NOT silently swallow shortfalls (the old behaviour).

## Build (per spec 15)
1. `record-movement.usecase.ts` — the engine, **requires** `tx`; `findBalanceForUpdate` (`SELECT … FOR UPDATE`) → compute on `Qty`/`Money` → upsert balance + insert movement in the same tx.
2. `deduct-for-order.ts` — implements `DeductStockPort`; every deduction routed through `recordMovement` with the passed `tx`.
3. Reads (`get-balance`, `list-balances`, `list-movements`) with existing cache tiers; `invalidateBalance` helper for post-commit callers.
4. Descriptor exposes `api: { recordMovement, deductStock: { deductForOrder }, invalidateBalance }`.

## Definition of done (mandatory defect tests)
- **P0-3:** force movement-insert failure ⇒ balance unchanged (atomic).
- **P0-4:** two parallel `out` movements totalling more than stock ⇒ exactly one throws `insufficientStock`.
- **P2-2:** costing unit test on `weightedAvgCost`.
- `bun run verify` + `bun run test` green; append descriptor.

## Notes / gotchas
`layer: 2`, `dependsOn: ['material','recipe','uom']`. Build BEFORE `pos/order` (T-305 consumes `deductStock`). The engine never invalidates cache itself (it runs in a caller's tx) — the caller invalidates after commit.
