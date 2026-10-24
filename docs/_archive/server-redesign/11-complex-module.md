# Golden Path — Complex Module (`pos/order`)

The reference for a **complex** module: multiple sub-entities, cross-module atomic effects, a domain event, and a `read/` query. Applies to `pos`, `inventory`, `production`, `menu`, `iam`. Read [10-simple-module.md](./10-simple-module.md) first — this doc only adds what differs.

`pos/order` is the highest-complexity case (the current 450-line service). It shows every complex pattern; smaller complex modules use a subset.

## Folder

```
modules/pos/
├── pos.module.ts                    # aggregate descriptor (wires order + shift + table + voucher)
└── order/
    ├── domain/
    │   ├── order.ts                 # Order entity (uses Money), OrderLine
    │   ├── order.rules.ts           # assertOrderOpen, assertFullyPaid, ...
    │   ├── order.calculator.ts      # PURE totals math on Money/Qty
    │   ├── order.errors.ts
    │   └── events.ts                # OrderCompleted (past-tense)
    ├── contract/
    │   └── order.dto.ts
    ├── app/
    │   ├── ports.ts                 # OrderRepoPort + external ports it needs
    │   ├── create-order.usecase.ts
    │   ├── sync-lines.usecase.ts    # was the non-atomic delete+insert+update
    │   ├── apply-voucher.usecase.ts
    │   ├── record-payment.usecase.ts
    │   ├── complete-order.usecase.ts# the P0 fix lives here
    │   └── void-order.usecase.ts
    ├── infra/
    │   └── order.repo.drizzle.ts
    ├── read/
    │   └── order-detail.query.ts    # enriched detail (lines + modifiers + payments)
    └── http/
        └── order.route.ts
```

## 1. Domain — `Money` in the entity, pure calculator

```ts
// order/domain/order.ts
import type { Money } from '@/shared/domain/money.ts'
export interface Order {
  id: number; orderNo: string; locationId: number; shiftId: number; tableId: number | null
  status: 'open' | 'completed' | 'voided'
  subtotal: Money; discountAmount: Money; taxAmount: Money; total: Money
  voucherId: number | null
}
```

```ts
// order/domain/order.calculator.ts — PURE, operates on Money (04-value-objects)
import { Money } from '@/shared/domain/money.ts'
import { Qty } from '@/shared/domain/qty.ts'

export function calcLineTotal(basePrice: Money, modifierPrices: Money[], qty: Qty): {
  unitPrice: Money; modifierTotal: Money; lineTotal: Money
} {
  const modifierTotal = modifierPrices.reduce((a, m) => a.add(m), Money.zero())
  const unitPrice = basePrice.add(modifierTotal)
  return { unitPrice, modifierTotal, lineTotal: unitPrice.mul(qty) }
}

export function calcOrderTotals(lineTotals: Money[], discount: Money, taxRatePercent: number): {
  subtotal: Money; discountAmount: Money; taxAmount: Money; total: Money
} {
  const subtotal = lineTotals.reduce((a, l) => a.add(l), Money.zero())
  const taxable = subtotal.sub(discount)
  const taxAmount = taxable.percent(taxRatePercent)
  return { subtotal, discountAmount: discount, taxAmount, total: taxable.add(taxAmount) }
}
```

```ts
// order/domain/order.rules.ts — assert* throw (07-audit-errors)
import { OrderError } from './order.errors.ts'
import type { Order } from './order.ts'
export function assertOrderOpen(o: Order): void { if (o.status !== 'open') throw OrderError.notOpen(o.id) }
```

```ts
// order/domain/events.ts
export class OrderCompleted {
  readonly type = 'OrderCompleted' as const
  constructor(readonly orderId: number, readonly locationId: number, readonly total: string) {}
}
```

## 2. Ports — this module needs another module's atomic effect

The key complex pattern: `complete-order` must deduct stock **atomically**. It declares a port for that effect; the descriptor wires it from the inventory module, passing `tx` through.

```ts
// order/app/ports.ts
import type { DbContext, Tx } from '@/infra/database/client.ts'
import type { Order } from '../domain/order.ts'

export interface OrderRepoPort {
  readonly db: DbContext
  findById(id: number, cx?: DbContext | Tx): Promise<Order | undefined>
  markCompleted(id: number, actorId: number, cx: Tx): Promise<{ id: number } | undefined>
  sumPayments(id: number, cx?: DbContext | Tx): Promise<string>
  findLines(id: number, cx?: DbContext | Tx): Promise<OrderLineRow[]>
  // sync-lines:
  deleteLines(orderId: number, cx: Tx): Promise<void>
  insertLines(rows: OrderLineInsert[], cx: Tx): Promise<void>
  updateTotals(id: number, totals: TotalsPatch, actorId: number, cx: Tx): Promise<{ id: number } | undefined>
}

/** ATOMIC cross-module effect — implemented by the inventory module, takes `tx`. */
export interface DeductStockPort {
  deductForOrder(order: Order, lines: OrderLineRow[], actorId: number, cx: Tx): Promise<void>
}

/** ATOMIC cross-module effect — implemented by voucher sub-module, takes `tx`. */
export interface IncrementVoucherUsagePort {
  increment(voucherId: number, cx: Tx): Promise<void>
}

/** Read of company tax rate (downward dependency). */
export interface TaxRatePort { getPercent(): Promise<number> }
```

## 3. The P0 fix — `complete-order.usecase.ts`

Stock deduction is now **synchronous inside the UoW**. Insufficient stock throws `ConflictError` → the whole completion rolls back. The `OrderCompleted` event fires only **after** commit, for non-critical effects (notification).

```ts
// order/app/complete-order.usecase.ts
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import type { CachePort } from '@/shared/cache/cache.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { EventBusPort } from '@/shared/events/event-bus.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import { Money } from '@/shared/domain/money.ts'
import { assertOrderOpen } from '../domain/order.rules.ts'
import { OrderError } from '../domain/order.errors.ts'
import { OrderCompleted } from '../domain/events.ts'
import type { OrderRepoPort, DeductStockPort, IncrementVoucherUsagePort } from './ports.ts'

export interface CompleteOrderDeps {
  uow: UnitOfWork; orderRepo: OrderRepoPort; deductStock: DeductStockPort
  vouchers: IncrementVoucherUsagePort; audit: AuditPort; cache: CachePort; events: EventBusPort
}

export function makeCompleteOrder(deps: CompleteOrderDeps) {
  return async (input: { orderId: number }, actor: Actor): Promise<EntityRef> => {
    const outcome = await deps.uow.run(async (tx) => {
      // 1. LOAD + RULE
      const order = await deps.orderRepo.findById(input.orderId, tx)
      if (!order) throw OrderError.notFound(input.orderId)
      assertOrderOpen(order)

      // 2. fully-paid check (pure comparison on Money)
      if (!order.total.isZero()) {
        const paid = Money.of(await deps.orderRepo.sumPayments(order.id, tx))
        if (paid.gte(order.total) === false) {
          throw OrderError.notFullyPaid(order.id, order.total.sub(paid).toNumeric())
        }
      }

      // 3. PERSIST status
      const written = await deps.orderRepo.markCompleted(order.id, actor.id, tx)
      if (!written) throw OrderError.updateFailed(order.id)

      // 4. ATOMIC EFFECTS (sync, same tx) — insufficient stock throws → rolls back completion
      const lines = await deps.orderRepo.findLines(order.id, tx)
      await deps.deductStock.deductForOrder(order, lines, actor.id, tx)
      if (order.voucherId) await deps.vouchers.increment(order.voucherId, tx)

      // 5. AUDIT (awaited, in tx)
      await deps.audit.record({
        actorId: actor.id, actorName: actor.name, locationId: order.locationId,
        module: 'pos-order', entity: 'order', entityId: order.id, action: 'complete',
        summary: `Completed order #${order.id} (${order.orderNo})`,
        oldValues: { status: 'open' }, newValues: { status: 'completed' },
      }, tx)

      return { id: order.id, locationId: order.locationId, total: order.total.toNumeric() }
    })

    // 6. NON-CRITICAL EFFECT — after commit (03-event-bus)
    deps.events.publish(new OrderCompleted(outcome.id, outcome.locationId, outcome.total))
    // 7. CACHE
    await deps.cache.invalidate('pos-order', outcome.id)
    return { id: outcome.id }
  }
}
```

> Contrast with the current code: there, the order was marked `completed`, THEN `deductStockForOrder(...).catch(log)` ran in a separate context — a deduction failure left a completed order with wrong stock and only a warning. Here, deduction is step 4 inside the transaction, so it cannot silently fail.

## 4. `sync-lines.usecase.ts` — the non-atomic bug, fixed

The current delete→insert→update is wrapped in one UoW.

```ts
export function makeSyncLines(deps: SyncLinesDeps) {
  return async (input: SyncLinesInput, actor: Actor): Promise<{ id: number }> => {
    return deps.uow.run(async (tx) => {
      const order = await deps.orderRepo.findById(input.orderId, tx)
      if (!order) throw OrderError.notFound(input.orderId)
      assertOrderOpen(order)
      // ... resolve items, compute line totals with calcLineTotal (pure) ...
      await deps.orderRepo.deleteLines(order.id, tx)     // all three
      await deps.orderRepo.insertLines(lineRows, tx)     // in one
      const totals = calcOrderTotals(lineTotals, order.discountAmount, await deps.tax.getPercent())
      const written = await deps.orderRepo.updateTotals(order.id, {
        subtotal: totals.subtotal.toNumeric(), discountAmount: totals.discountAmount.toNumeric(),
        taxAmount: totals.taxAmount.toNumeric(), total: totals.total.toNumeric(),
      }, actor.id, tx)
      if (!written) throw OrderError.updateFailed(order.id)
      return written                                     // transaction — atomic
    })
  }
}
```

## 5. `read/order-detail.query.ts` — lightweight CQRS ([08](./08-read-cqrs.md))

```ts
export function makeOrderDetailQuery(db: DbContext) {
  return async (id: number): Promise<OrderDetailDto> => {
    // one optimized query with joins to lines / modifiers / payments, mapped to the DTO.
    // read-only, no uow, no domain rules.
  }
}
```

## 6. Aggregate descriptor — wiring atomic effects across modules

```ts
// pos.module.ts (order slice shown)
export const posModule: ModuleDescriptor = {
  name: 'pos', layer: 2,
  dependsOn: ['location', 'payment-method', 'company', 'menu', 'recipe', 'inventory', 'uom', 'material'],
  create(ctx, deps) {
    const orderRepo = new OrderRepoDrizzle(ctx.db)
    const inventoryApi = deps.inventory.api as { deductStock: DeductStockPort }
    const companyApi = deps.company.api as { taxRate: TaxRatePort }

    const completeOrder = makeCompleteOrder({
      uow: ctx.uow, orderRepo, audit: ctx.auditPort, cache: ctx.cache, events: ctx.events,
      deductStock: inventoryApi.deductStock,          // ATOMIC effect, threaded tx
      vouchers: voucherIncrementAdapter,
    })
    // ... other use-cases + order-detail query ...
    return { route: createOrderRoute({ completeOrder, /* ... */ }, { detail: makeOrderDetailQuery(ctx.db) }), api: {} }
  },
}
```

> The inventory module exports `api.deductStock` (a `DeductStockPort`). Its `deductForOrder(order, lines, actorId, tx)` runs the recipe→material→stock-movement logic **using the passed `tx`**, so it commits with the order. This is the hybrid rule in action: atomic → sync in UoW.

## 7. Differences from the simple module (summary)

| Aspect | Simple (`location`) | Complex (`pos/order`) |
| --- | --- | --- |
| Sub-entities | one entity | order + lines + payments (+ sibling shift/table/voucher) |
| Money | none | `Money`/`Qty` in domain + pure calculator |
| Cross-module atomic effect | none | `DeductStockPort`, `IncrementVoucherUsagePort` threaded with `tx` |
| Domain event | none | `OrderCompleted` (post-commit) |
| `read/` folder | none | `order-detail.query.ts` |
| Use-cases | 5 CRUD | domain verbs (create, sync-lines, apply-voucher, record-payment, complete, void) |

---

**Next:** [12-module-checklist.md](./12-module-checklist.md)
