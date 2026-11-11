# Migrate `pos/order` (Critical)

The highest-risk migration: it carries two P0 defects and the tax/RBAC gaps. Follow [11-complex-module.md](./11-complex-module.md) for shape; this doc is the exact per-file work plan and the fixes to verify.

## Defects this migration must fix

| # | Current behaviour | Fix | Verify |
| --- | --- | --- | --- |
| P0-1 | `handleComplete` marks order `completed`, then `deductStockForOrder(...).catch(log)` runs separately — a deduction failure leaves a completed order with wrong stock, only a warning | Deduct stock **synchronously inside the UoW** (step 4); insufficient stock throws `ConflictError` → completion rolls back | Integration test: complete with insufficient stock ⇒ order stays `open`, no stock change |
| P0-2 | `handleSyncLines` does `deleteLines` → `insertLines` → `update` totals as 3 separate statements | All three inside one `uow.run` | Integration test: force insert failure ⇒ old lines still present |
| P1-1 | routes only `auth: true` — RBAC unenforced | every route declares `permission: 'pos-order.<action>'` | user without permission ⇒ 403 |
| P1-2 | audit fire-and-forget, `userName: ''` | `AuditPort.record(entry, tx)` in UoW, `actorName` from `actorOf(auth)` | audit row exists iff op commits; `actorName` non-empty |
| P2-1 | `Number(order.subtotal)` etc. throughout | `Money` in domain + `calcOrderTotals`/`calcLineTotal` | unit test on calculator |

## Target files

```
modules/pos/order/
├── domain/ order.ts · order.rules.ts · order.calculator.ts · order.errors.ts · events.ts
├── contract/ order.dto.ts
├── app/ ports.ts · create-order · sync-lines · apply-voucher · remove-voucher · record-payment · complete-order · void-order (each .usecase.ts)
├── infra/ order.repo.drizzle.ts
├── read/ order-detail.query.ts
└── http/ order.route.ts
```

## Per-file plan

### domain/
- **order.ts** — `Order` entity with `Money` fields (`subtotal`, `discountAmount`, `taxAmount`, `total`); `OrderLine` with `Qty` quantity + `Money` prices. `rowToOrder` maps `numeric` strings → `Money.of(...)`.
- **order.calculator.ts** — port `calculateLineTotal` and `calculateOrderTotals` from the current `order.calculator.ts`, rewritten on `Money`/`Qty` (see [11](./11-complex-module.md) §1). Pure. This is where all totals math lives — no arithmetic in use-cases.
- **order.rules.ts** — `assertOrderOpen`, `assertNoVoucherYet`, `assertVoucherApplied`, `assertPaymentWithinRemaining`, `assertFullyPaid`. Each throws (07).
- **order.errors.ts** — move `OrderError` factories from `order.internal.ts`; add `insufficientStock` (used by the deduction path) and keep `notOpen`, `notFullyPaid`, `paymentExceedsTotal`, etc.
- **events.ts** — `OrderCompleted(orderId, locationId, total)`. (Only non-critical subscribers — notification/reporting — listen; stock is NOT here.)

### app/ports.ts
Declare `OrderRepoPort` (findById, findLines, markCompleted, markVoided, insert, updateTotals, deleteLines, insertLines, insertPayment, sumPayments — writes take `cx: Tx`), plus the external ports it consumes, each taking `tx` for atomic effects:
- `DeductStockPort.deductForOrder(order, lines, actorId, tx)` — from `inventory/stock`
- `IncrementVoucherUsagePort.increment(voucherId, tx)` — from `pos/voucher`
- `TableStatusPort.updateStatus(tableId, status, tx)` — from `pos/table`
- read-only downward ports: `TaxRatePort` (company), `ShiftPort.getActive`, `MenuItemPort.itemDetail`, `VoucherValidatePort.validate`, `PaymentMethodPort.byLocation`

### app/*.usecase.ts (one file each)

| Use-case | UoW? | Atomic effects (in tx) | Post-commit |
| --- | --- | --- | --- |
| `create-order` | yes | table→occupied (if dine-in) | cache |
| `sync-lines` | yes | delete+insert lines, update totals (**P0-2**) | cache |
| `apply-voucher` | yes | recompute totals | cache |
| `remove-voucher` | yes | recompute totals | cache |
| `record-payment` | yes | insert payment | cache |
| `complete-order` | yes | deduct stock (**P0-1**), increment voucher, table→available | `OrderCompleted` event, cache |
| `void-order` | yes | table→available | cache |

Every write use-case: `uow.run` → load → `assert*` rules → persist → atomic effects (threaded `tx`) → `audit.record(entry, tx)` → return; then events + cache **after** commit. Copy `complete-order` verbatim from [11](./11-complex-module.md) §3.

### infra/order.repo.drizzle.ts
Implements `OrderRepoPort`. All writes take `cx: Tx`. `sumPayments` returns a `numeric` string (caller wraps in `Money`). No business logic.

### read/order-detail.query.ts
Move `findDetailById` here as a read-query: one joined SELECT (order + lines + modifiers snapshot + payments) → `OrderDetailDto`. No uow, no domain. ([08](./08-read-cqrs.md))

### http/order.route.ts
`.use(rbac)`. Permissions: `pos-order.read` (list/detail), `pos-order.create`, `pos-order.update` (sync-lines/apply-voucher/remove-voucher/record-payment), `pos-order.complete`, `pos-order.void`. Each handler: validate → one use-case → `res.*`.

## Wiring (in `pos.module.ts`)
`dependsOn: ['company','menu','payment-method','recipe','inventory','uom','material','location']` plus sibling sub-modules `shift`,`table`,`voucher` (same-group). Wire `deductStock` from `deps.inventory.api`, `taxRate` from `deps.company.api`, etc. — see [11](./11-complex-module.md) §6.

## Tax rate note
Currently a single company `taxRate`. Keep that (company `api.taxRate.getPercent()`), applied in `calcOrderTotals`. Per-location tax is out of scope; if needed later it becomes a `TaxRatePort` that takes `locationId` — no use-case change beyond the argument.

## Definition of done
All boxes in [12-module-checklist.md](./12-module-checklist.md) plus the four defect tests in the table above green.

---

**Next:** [15-migrate-inventory-stock.md](./15-migrate-inventory-stock.md)
