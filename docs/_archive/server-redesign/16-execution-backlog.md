# Execution Backlog (Dependency-Ordered)

The order in which GPT Sol builds the modules. Strictly bottom-up by layer, and within a layer, dependencies before dependents. Each module is one work unit; do not start a module until every module it `dependsOn` is done. After each module: run `bun run verify` + `bun run test` (from `apps/server`) — do not proceed on red.

## Phase 0 — Shared foundation (build first, once)

These are prerequisites for **every** module. Build and verify before any module.

| # | Item | Spec |
| --- | --- | --- |
| 0.1 | Neon **WebSocket** DB client + `DbContext`/`Tx` types | [02](./02-transaction-uow.md) §1 |
| 0.2 | `UnitOfWork` port + Drizzle adapter (`uow`) | [02](./02-transaction-uow.md) §2 |
| 0.3 | `CachePort` + memory adapter | [05](./05-cache-port.md) |
| 0.4 | `EventBusPort` + memory adapter | [03](./03-event-bus.md) |
| 0.5 | `AuditPort` + Drizzle adapter (in `audit` infra) | [07](./07-audit-errors.md) |
| 0.6 | `Money` + `Qty` + `weightedAvgCost` (shared/domain) | [04](./04-value-objects.md) |
| 0.7 | RBAC macro (`rbac` plugin) + `actorOf` + `AuthContext.userName` | [06](./06-rbac.md) |
| 0.8 | `ModuleDescriptor` + `composeModules` | [09](./09-module-registry.md) |
| 0.9 | Schema: convert all `is_*` integer columns → native boolean; `db:generate` + `db:migrate` | ADR-0008, [13](./13-migration-overview.md) |

> Phase 0 items have no module dependencies and unblock everything. A mistake here breaks all modules, so verify each with a tiny self-check (e.g. a test that `uow.run` rolls back on throw; that `Money.of('0.1').add(Money.of('0.2')).toNumeric() === '0.30'`).

## Phase 1 — Layer 0 (Core)

| # | Module | dependsOn | Notes |
| --- | --- | --- | --- |
| 1.1 | `audit` | — | provides `AuditPort` adapter + read endpoints |
| 1.2 | `company` | — | exposes `api.taxRate` |
| 1.3 | `auth` | (reads iam users) | build after `iam` if it needs user lookups; otherwise stub the user port. Resolve `userName` into `AuthContext`. |

## Phase 2 — Layer 1 (Master Data), dependency-ordered

| # | Module | dependsOn | Notes |
| --- | --- | --- | --- |
| 2.1 | `location` | — | **golden-path reference** — build first, it teaches the pattern |
| 2.2 | `uom` | — | move resolver to `domain/` |
| 2.3 | `iam` | location | complex; owns permission seeding |
| 2.4 | `material` | uom, location | medium; `assignment` exposes `api.isAssigned` |
| 2.5 | `supplier` | material, uom | |
| 2.6 | `payment-method` | location | exposes `api.byLocation` |
| 2.7 | `menu` | location | complex; exposes `api.itemDetail` |
| 2.8 | `recipe` | material, uom, menu | exposes `api.activeByMenuItem`, `api.linesByRecipe` |

> Build `location` (2.1) completely first and get it reviewed — it is the template every later module copies. A correct `location` de-risks the whole backlog.

## Phase 3 — Layer 2 (Operations), dependency-ordered

| # | Module | dependsOn | Notes |
| --- | --- | --- | --- |
| 3.1 | `inventory/stock` | material(assignment), recipe, uom | **CRITICAL** — [15](./15-migrate-inventory-stock.md). Build before pos/order (order needs `deductStock`). |
| 3.2 | `pos/shift` | location | exposes `api.getActive` |
| 3.3 | `pos/table` | location | exposes `api.updateStatus` |
| 3.4 | `pos/voucher` | — | exposes `api.validate`, `api.increment` |
| 3.5 | `pos/order` | company, menu, payment-method, recipe, inventory/stock, uom, material, + shift/table/voucher | **CRITICAL** — [14](./14-migrate-pos-order.md). Build last in this phase; needs all the above. |
| 3.6 | `inventory/receiving` | material, supplier, inventory/stock | movements on confirm (atomic) |
| 3.7 | `inventory/transfer` | material, inventory/stock | movements on ship/receive (atomic) |
| 3.8 | `inventory/opname` | material, inventory/stock | adjustment movements on complete (atomic) |
| 3.9 | `production` | material, inventory/stock, uom | deduct inputs + add output (atomic) |

## Out of scope (this pass)

`finance`, `hr`, `crm`, `reporting` — not built now. They follow the same golden paths when scheduled.

## Rules for the implementer running this backlog

1. **One module at a time, in this order.** Never start a module whose `dependsOn` isn't fully done + verified.
2. **Phase 0 is non-negotiable and comes first.** Every module imports it.
3. **After each module:** `bun run verify` then `bun run test`. Red = stop and fix before moving on.
4. **Copy the golden path** ([10](./10-simple-module.md)/[11](./11-complex-module.md)); do not invent structure.
5. **The two CRITICAL modules** (`inventory/stock`, `pos/order`) have dedicated specs ([15](./15-migrate-inventory-stock.md), [14](./14-migrate-pos-order.md)) with mandatory defect tests — those tests are the proof the P0s are fixed.
6. **Register** each finished module's descriptor in `ALL_MODULE_DESCRIPTORS`; the composer catches ordering/cycle mistakes at startup.

---

**Next:** Stage 5 — spec consistency verification.
