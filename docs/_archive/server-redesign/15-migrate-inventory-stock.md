# Migrate `inventory/stock` (Critical)

The other half of the P0: the stock engine other modules call. It must become transactional, race-safe, and expose the atomic `DeductStockPort` that `pos/order`, `receiving`, `transfer`, `opname`, and `production` consume.

## Defects this migration must fix

| # | Current behaviour | Fix | Verify |
| --- | --- | --- | --- |
| P0-3 | `recordMovement` does `findBalance` → compute → `upsertBalance` → `insertMovement` as separate statements with **no transaction** | The whole engine runs inside the caller's `tx` (it always receives `cx: Tx`); balance upsert + movement insert are one atomic unit | Integration test: force movement-insert failure ⇒ balance unchanged |
| P0-4 | Read-compute-write balance has a **race**: two concurrent movements read the same `oldQty` and one overwrites the other; the `quantity >= 0` CHECK can be bypassed under concurrency | `SELECT ... FOR UPDATE` the balance row inside the tx before computing (`findBalanceForUpdate`), so concurrent movements serialize on the row | Concurrency test: two parallel out-movements totalling more than stock ⇒ exactly one throws `insufficientStock` |
| P1-3 | insufficient-stock during order deduction was swallowed as `logger.warn` (via the fire-and-forget path) | `recordMovement` throws `StockError.insufficientStock`; since it now runs in the order's `tx`, completion rolls back | covered by pos-order P0-1 test |
| P2-2 | `Number`/`toDecimal(string)` scattered | `Qty`/`Money` value objects; weighted-avg-cost via `weightedAvgCost(Qty, Money, Qty, Money)` ([04](./04-value-objects.md) §3) | unit test on costing |

## Key design: the engine always runs in a transaction

The current `recordMovement(input, db?)` makes `db` optional and defaults to `this.repo.db` (no tx). In the redesign there is **one** entry, and it **requires** a `tx`:

```ts
// app/record-movement.usecase.ts  (the core engine — always called inside a caller's UoW)
export function makeRecordMovement(deps: RecordMovementDeps) {
  return async (input: RecordMovementInput, actorId: number, tx: Tx): Promise<EntityRef> => {
    // 1. material assigned to location?
    if (!(await deps.assignment.isAssigned(input.materialId, input.locationId, tx))) {
      throw StockError.materialNotAssigned(input.materialId, input.locationId)
    }
    // 2. LOCK + read balance (P0-4 fix)
    const current = await deps.repo.findBalanceForUpdate(input.materialId, input.locationId, tx)
    const oldQty = Qty.of(current?.quantity ?? '0')
    const oldCost = Money.of(current?.costPrice ?? '0')
    const moveQty = Qty.of(input.qty)

    // 3. compute new balance (pure)
    let newQty = oldQty
    let newCost = oldCost
    if (input.direction === 'in') {
      newQty = oldQty.add(moveQty)
      if (input.unitCost && !newQty.isZero()) {
        newCost = weightedAvgCost(oldQty, oldCost, moveQty, Money.of(input.unitCost))
      }
    } else {
      if (oldQty.lt(moveQty)) {
        throw StockError.insufficientStock(input.materialId, input.locationId, oldQty.toNumeric(), input.qty)
      }
      newQty = oldQty.sub(moveQty)
    }
    // 4. upsert balance + 5. insert movement — same tx (P0-3 fix)
    await deps.repo.upsertBalance(input.materialId, input.locationId, newQty.toNumeric(), newCost.toNumeric(), tx)
    const movement = await deps.repo.insertMovement({ ...input, costPrice: newCost.toNumeric(), createdBy: actorId }, tx)
    if (!movement) throw StockError.movementFailed()
    return movement
  }
}
```

> Cache invalidation for balances happens in the **calling** use-case after its commit (the engine is inside a tx and must not invalidate mid-transaction). The stock module exposes an `invalidateBalance(materialId, locationId)` helper the caller runs post-commit, OR the caller invalidates the `inventory-stock` namespace.

## The `DeductStockPort` (what `pos/order` calls)

This wraps the recipe→material→movement logic from the current `order.deduction.ts`, but **every deduction runs through `recordMovement` with the same `tx`**, so a shortfall rolls the order back.

```ts
// app/deduct-for-order.ts  (implements DeductStockPort)
export function makeDeductForOrder(deps: {
  recipe: RecipePort; material: MaterialPort; uom: UomPort; recordMovement: RecordMovement
}) {
  return async (order: Order, lines: OrderLineRow[], actorId: number, tx: Tx): Promise<void> => {
    const conversions = await deps.uom.getAllConversions(tx)
    for (const line of lines) {
      const recipe = await deps.recipe.activeByMenuItem(line.menuItemId, tx)
      if (!recipe) continue                         // no recipe = nothing to deduct (documented behaviour)
      const recipeLines = await deps.recipe.linesByRecipe(recipe.id, tx)
      const orderQty = Qty.of(line.quantity)
      const yieldQty = Qty.of(recipe.yieldQty)
      for (const rl of recipeLines) {
        const deductQty = Qty.of(rl.quantity).mul(orderQty).div(yieldQty)   // safe div
        const material = await deps.material.getById(rl.materialId, tx)
        if (!material) throw StockError.materialNotFound(rl.materialId)
        const baseQty = convertToBaseUom(deductQty, rl.uomId, material.baseUomId, conversions)
        await deps.recordMovement(
          { materialId: rl.materialId, locationId: order.locationId, type: 'sale', direction: 'out',
            qty: baseQty.toNumeric(), referenceType: 'order', referenceId: order.id },
          actorId, tx,                                // ← same tx: insufficient stock throws → order rolls back
        )
      }
    }
  }
}
```

> **Behaviour change (intended):** the current code swallows every per-line deduction error as a warning and lets the order complete. The redesign makes insufficient stock **fail the completion**. This is the correctness fix. If the business genuinely wants "sell even when stock is short" (negative/permissive stock), that must be an explicit policy flag on the use-case — not a silent swallow. Assumption: **strict stock** (a sale cannot complete without stock). Flag it to the product owner if that is wrong.

## Target files
```
modules/inventory/stock/
├── domain/ stock.ts · stock.rules.ts · stock.errors.ts · (costing via shared/domain/costing.ts)
├── contract/ stock.dto.ts
├── app/ ports.ts · record-movement.usecase.ts · deduct-for-order.ts · (read use-cases: get-balance, list-balances, list-movements)
├── infra/ stock.repo.drizzle.ts   (findBalanceForUpdate uses .for('update'))
├── read/ (optional: stock-balance views)
└── stock.module.ts
```

## Repo note — `findBalanceForUpdate`
```ts
async findBalanceForUpdate(materialId: number, locationId: number, tx: Tx) {
  return tx.select().from(stockBalances)
    .where(and(eq(stockBalances.materialId, materialId), eq(stockBalances.locationId, locationId)))
    .for('update')          // row lock — serializes concurrent movements (P0-4)
    .limit(1).then(takeFirst)
}
```
Reads (`get-balance`, `list-balances`, `list-movements`) stay as no-uow use-cases / read-queries with the existing cache tiers.

## `api` surface
```ts
api: {
  deductStock: { deductForOrder },        // DeductStockPort — atomic, takes tx
  recordMovement,                         // for receiving/transfer/opname/production — atomic, takes tx
  invalidateBalance,                      // post-commit cache helper for callers
}
```

## Definition of done
[12-module-checklist.md](./12-module-checklist.md) plus P0-3, P0-4, P2-2 tests green, and the shared pos-order P0-1 test green.

---

**Next:** [16-execution-backlog.md](./16-execution-backlog.md)
