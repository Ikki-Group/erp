# Migration Overview — Every Module Old → New

Maps each existing module to its redesigned shape and lists schema changes. The golden-path templates ([10](./10-simple-module.md), [11](./11-complex-module.md)) define the target; this doc says, per module, which template applies and what changes. Read [12-module-checklist.md](./12-module-checklist.md) for the build order within each module.

## Global changes (apply to EVERY module)

| Change | From | To | Spec |
| --- | --- | --- | --- |
| File layout | flat `{m}.{layer}.ts` | layer folders `domain/ app/ infra/ contract/ http/` (+ `read/`) | [01](./01-architecture.md), [10](./10-simple-module.md) |
| Service | one `*.service.ts` class with `handleX` | one file per **use-case** in `app/` | [10](./10-simple-module.md) §7 |
| Repo | `I{M}Repo` + class, `db?` param | `{M}RepoPort` in `app/ports.ts`, `{M}RepoDrizzle` in `infra/`, `cx: DbContext \| Tx` param | [02](./02-transaction-uow.md) §3 |
| Transactions | `withTransaction` (no-op) | real `uow.run` per write use-case | [02](./02-transaction-uow.md) |
| Booleans | `integer 0/1` + `? 1 : 0` / `=== 1` | native `boolean` | ADR-0008 |
| Money/Qty | `Number(string)` arithmetic | `Money` / `Qty` value objects | [04](./04-value-objects.md) |
| Cache | `CacheService` direct | `CachePort` (memory adapter) | [05](./05-cache-port.md) |
| Audit | `auditLog.record` fire-and-forget, `userName: ''` | `AuditPort.record(entry, tx)` in UoW, real `actorName` | [07](./07-audit-errors.md) |
| Routes | `auth: true` only | `.use(rbac)` + `permission: '<m>.<action>'` on every route | [06](./06-rbac.md) |
| Errors | `{M}.internal.ts` factories | `domain/{m}.errors.ts` factories | [07](./07-audit-errors.md) |
| Wiring | manual in `app.ts` | `ModuleDescriptor` + composer | [09](./09-module-registry.md) |

## Schema: boolean columns to convert (ADR-0008)

Regenerate migrations from the new schema (pre-production, no data to preserve). Convert `integer` `is_*` columns to `boolean`:

| Table | Column | New |
| --- | --- | --- |
| `locations` | `is_active` | `boolean('is_active').notNull().default(true)` |
| `payment_methods` | `is_active` | same |
| `payment_method_locations` | `is_enabled` | `boolean(...).notNull().default(true)` |
| `tables` | `is_active` | same |
| `vouchers` | `is_active` | same |
| `materials`, `material_categories` | `is_active` | same (verify in `material.ts`) |
| `uoms` | `is_active` | same (verify in `uom.ts`) |
| `suppliers` | `is_active` | same (verify in `supplier.ts`) |
| `menu_items`, `menu_categories`, `modifier_*` | `is_active` | same (verify in `menu.ts`) |
| `roles`, `users` | `is_active` | same (verify in `iam.ts`) |
| `recipes` | `is_active` | same (verify in `recipe.ts`) |
| `production_recipes` | `is_active` | same (verify in `production.ts`) |

Also update `_helpers.ts`:

```ts
// db/schema/_helpers.ts — softDeleteColumns
export const softDeleteColumns = {
  isActive: boolean('is_active').notNull().default(true),   // was integer 0/1
}
```

> The implementer must grep each schema file for `integer('is_` and `.default(1)` / `.default(0)` on boolean-intent columns and convert them. Enum-status columns (e.g. `status`) are NOT booleans — leave them.

## Per-module mapping

Legend: **Template** = which golden path to follow. **Notable** = anything beyond the mechanical global changes.

### Layer 0 — Core

| Module | Template | Notable |
| --- | --- | --- |
| `auth` | simple (10) | No entity CRUD; use-cases = `login`, `logout`. `login`/`register`/`health` are the only routes without `permission` ([06](./06-rbac.md) §4). Auth plugin must resolve `userName` into `AuthContext` (closes empty-audit gap). |
| `company` | simple (10) | Singleton settings. Exposes `api.taxRate: TaxRatePort` consumed by `pos/order` ([11](./11-complex-module.md) §2). |
| `audit` | simple (10) | Provides the `AuditPort` adapter (`infra/audit`) + read endpoints. This module OWNS the audit write path used by all others. |

### Layer 1 — Master Data

| Module | Template | Notable |
| --- | --- | --- |
| `location` | simple (10) | This is the golden-path example itself. |
| `uom` | simple (10) | Keep `uom.resolver.ts` conversion logic — move it to `domain/uom.resolver.ts` (it is pure). |
| `supplier` | simple (10) | `supplier_materials` pricing is a sub-entity → medium; use the sub-folder pattern. |
| `payment-method` | simple (10) | `payment_method_locations` config is a sub-entity. Exposes `api.byLocation` for `pos/order`. |
| `material` | medium (10 + sub-folders) | `category/` + `assignment/` sub-entities. `assignment` exposes `api.isAssigned` consumed by `inventory/stock`. |
| `menu` | complex (11) | `modifier_groups`/`options`, `composed/` enriched read → `read/menu-item-detail.query.ts`. Exposes `api.itemDetail` for `pos/order`. |
| `recipe` | simple (10) | `recipe_lines` sub-entity. Exposes `api.activeByMenuItem` + `api.linesByRecipe` for stock deduction. |
| `iam` | complex (11) | `user`/`role`/`assignment` sub-entities + `composed/`. Owns permission vocabulary seeding. Exposes `api.userRepo`-equivalent read for auth. |

### Layer 2 — Operations

| Module | Template | Notable |
| --- | --- | --- |
| `pos/order` | complex (11) | **Critical.** See [14-migrate-pos-order.md](./14-migrate-pos-order.md). P0 stock-deduction + non-atomic sync-lines fixes. |
| `pos/shift` | simple (10) | Exposes `api.getActive` for `pos/order`. |
| `pos/table` | simple (10) | Exposes `api.updateStatus` (atomic effect within order create/complete/void, threaded `tx`). |
| `pos/voucher` | simple (10) | Exposes `api.validate`, `api.increment` (atomic, `tx`). |
| `inventory/stock` | simple→medium (10) | **Critical.** See [15-migrate-inventory-stock.md](./15-migrate-inventory-stock.md). P0 non-atomic balance update + race. Exposes `api.deductStock` (`DeductStockPort`). |
| `inventory/receiving` | simple (10) | `receiving_lines` sub-entity. On confirm: stock movements (atomic, `tx`). |
| `inventory/transfer` | simple (10) | `transfer_lines`. Ship/receive create movements (atomic, `tx`). |
| `inventory/opname` | simple (10) | `stock_opname_lines`. Complete → adjustment movements (atomic, `tx`). |
| `production` | simple (10) | Deduct inputs + add output = movements (atomic, `tx`). |

### Layer 2/3 — Out of scope this pass

`finance`, `hr`, `crm` (empty folders) and `reporting` are **not** part of this migration (per the locked scope). When built later, they follow the same golden paths; `reporting` is a `read/`-only aggregator module.

## Cross-module `api` surface summary

Each module's descriptor exposes a small `api` object; consumers depend on it via `dependsOn` ([09](./09-module-registry.md)). Atomic-effect functions take `tx`.

| Module | `api` exposes | Consumed by |
| --- | --- | --- |
| `company` | `taxRate.getPercent()` | pos/order |
| `material.assignment` | `isAssigned(materialId, locationId)` | inventory/stock |
| `menu` | `itemDetail(id)` | pos/order |
| `recipe` | `activeByMenuItem(id)`, `linesByRecipe(id)` | inventory/stock (deduction) |
| `inventory/stock` | `deductStock: DeductStockPort` (`deductForOrder(order, lines, actorId, tx)`), `recordMovement(input, tx)` | pos/order, receiving, transfer, opname, production |
| `pos/shift` | `getActive(actorId, locationId)` | pos/order |
| `pos/table` | `updateStatus(id, status, tx)` | pos/order |
| `pos/voucher` | `validate(code, subtotal)`, `increment(id, tx)` | pos/order |

---

**Next:** [14-migrate-pos-order.md](./14-migrate-pos-order.md)
