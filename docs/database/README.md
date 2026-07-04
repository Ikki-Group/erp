# Database Documentation

Index for everything about the Ikki ERP database schema. Written primarily for
**AI agents** working in this repo — read this file first, then follow the
links below for the specific thing you need.

> Source of truth is always the code: `apps/server/src/db/schema/*.ts`. These
> docs describe and explain that code — if they ever disagree, the code wins
> and these docs need fixing.

## Start here

| I need to...                                                  | Read                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Understand a domain's tables/relationships before touching it | [`ERD_*.md`](#erd) — pick the file matching your domain                                  |
| Add a table, column, index, or constraint                     | [`SCHEMA_CONVENTIONS.md`](./SCHEMA_CONVENTIONS.md) — rules, not suggestions              |
| Understand how caching relates to schema design               | [`SCHEMA_CONVENTIONS.md#cache-friendliness`](./SCHEMA_CONVENTIONS.md#cache-friendliness) |
| Understand backend architecture beyond the DB                 | [`../architecture/SERVER_ARCHITECTURE.md`](../architecture/SERVER_ARCHITECTURE.md)       |
| Understand code patterns (services, repos, caching)           | [`../architecture/CODE_PATTERNS.md`](../architecture/CODE_PATTERNS.md)                   |

## Quick facts

- **Engine**: PostgreSQL (Neon serverless, free tier)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team) `1.0.0-rc.4`
- **Schema location**: `apps/server/src/db/schema/`
- **Layout**: flat — one `.ts` file per domain, no subfolders. File name matches the owning module in `apps/server/src/modules/{name}/`
- **~68 tables** across **21 domain files** (see table below)
- **IDs**: `serial` integers everywhere (see [conventions](./SCHEMA_CONVENTIONS.md#primary-keys))
- **Constraints**: `check()` constraints use Drizzle's query builder (`gte`, `between`, `and`, `or`, ...) — **never** raw `sql` template literals. One documented exception exists (`uom.ts`), explained inline.
- **Caching**: separate config/read-model tables where write-churn differs (e.g. `material_locations` vs `material_stock_snapshots`) so cache TTL can be tiered independently. See [`infra/cache/`](../../apps/server/src/infra/cache).
- **No ORM relational queries in hot paths**: the codebase deliberately avoids `db.query.x.findMany({ with: ... })` in repos/services — every relational query bypasses the cache layer. Use manual `.select()` + `RelationMap` instead (see `shared/utils/relation-map.ts`).

## Domain map

Matches the grouping comment in `apps/server/src/db/schema/index.ts`. Each
domain is **one file** — if a domain's owning module has submodules (e.g.
`iam` has `role`/`user`/`assignment`), the tables for all of them still live
in that one file, ordered by dependency.

| Layer        | Domain (schema file) | Owning module                                                          | Tables                                                                                                                                                                                             |
| ------------ | -------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core         | `audit.ts`           | `modules/audit`                                                        | `audit_logs`                                                                                                                                                                                       |
| Core         | `session.ts`         | `modules/session`                                                      | `sessions`                                                                                                                                                                                         |
| Core         | `iam.ts`             | `modules/iam` (role, user, assignment)                                 | `roles`, `users`, `user_assignments`                                                                                                                                                               |
| Master data  | `location.ts`        | `modules/location`                                                     | `locations`                                                                                                                                                                                        |
| Master data  | `uom.ts`             | `modules/uom`                                                          | `uoms`                                                                                                                                                                                             |
| Master data  | `tax.ts`             | _(none yet — see file header)_                                         | `taxes`                                                                                                                                                                                            |
| Master data  | `supplier.ts`        | `modules/supplier`                                                     | `suppliers`                                                                                                                                                                                        |
| Master data  | `company.ts`         | `modules/company`                                                      | `company_settings`                                                                                                                                                                                 |
| Master data  | `sales-type.ts`      | `modules/sales-type`                                                   | `sales_types`                                                                                                                                                                                      |
| Master data  | `material.ts`        | `modules/material`                                                     | `material_categories`, `materials`, `material_conversions`, `material_locations`, `material_stock_snapshots`                                                                                       |
| Master data  | `product.ts`         | `modules/product`                                                      | `product_categories`, `products`, `product_prices`, `product_variants`, `product_variant_prices`                                                                                                   |
| Operations   | `crm.ts`             | `modules/crm`                                                          | `customers`, `customer_loyalty_transactions`                                                                                                                                                       |
| Operations   | `hr.ts`              | `modules/hr` (employee, hr, payroll, leave-request)                    | `employees`, `shifts`, `attendances`, `payroll_batches`, `payroll_items`, `payroll_adjustments`, `leave_requests`                                                                                  |
| Operations   | `finance.ts`         | `modules/finance` (account, general-ledger, expenditure)               | `accounts`, `journal_entries`, `journal_items`, `expenditures`                                                                                                                                     |
| Operations   | `payment.ts`         | `modules/payment` (provider, method, location-payment-method, payment) | `payment_providers`, `payment_methods`, `location_payment_methods`, `payments`, `payment_invoices`                                                                                                 |
| Operations   | `inventory.ts`       | `modules/inventory` (stock-transaction, stock-summary, stock-transfer) | `stock_batches`, `stock_adjustments`, `stock_adjustment_items`, `stock_transactions`, `stock_summaries`, `stock_transfers`, `stock_transfer_items`                                                 |
| Operations   | `purchasing.ts`      | `modules/purchasing`                                                   | `purchase_requests`\*, `purchase_request_items`\*, `purchase_orders`, `purchase_order_items`, `goods_receipt_notes`, `goods_receipt_note_items`, `purchase_invoices`\*, `purchase_invoice_items`\* |
| Operations   | `production.ts`      | `modules/production`                                                   | `work_orders`                                                                                                                                                                                      |
| Operations   | `recipe.ts`          | `modules/recipe`                                                       | `recipes`, `recipe_items`                                                                                                                                                                          |
| Operations   | `sales.ts`           | `modules/sales` (sales-order, sales-invoice)                           | `sales_orders`, `sales_order_batches`, `sales_order_items`, `sales_voids`, `sales_refunds`, `sales_external_refs`, `sales_invoices`, `sales_invoice_items`                                         |
| Integrations | `moka.ts`            | `modules/moka` (configuration, scrap)                                  | `moka_configurations`, `moka_scrap_histories`, `moka_sync_cursors`                                                                                                                                 |

\* Schema exists, no repo/service implements it yet — see the `⚠` comment in `purchasing.ts`.

## ERD

Split by architecture layer to stay readable — see [`ERD_OVERVIEW.md`](./ERD_OVERVIEW.md)
for the domain dependency graph, then the layer file for the domain you need:

- [`ERD_OVERVIEW.md`](./ERD_OVERVIEW.md) — domain dependency graph (which schema file imports which)
- [`ERD_CORE.md`](./ERD_CORE.md) — audit, session, iam
- [`ERD_MASTER_DATA.md`](./ERD_MASTER_DATA.md) — location, uom, tax, supplier, company, sales-type, material, product
- [`ERD_OPERATIONS.md`](./ERD_OPERATIONS.md) — crm, hr, finance, payment, inventory, purchasing, production, recipe, sales
- [`ERD_INTEGRATIONS.md`](./ERD_INTEGRATIONS.md) — moka

## Schema conventions

**[`SCHEMA_CONVENTIONS.md`](./SCHEMA_CONVENTIONS.md)** — read before writing or reviewing any schema change. Covers:

- File organization & naming
- Primary keys, audit columns, soft delete
- Constraints (query-builder only, no raw `sql`)
- Indexing rules
- Enums (colocated vs shared)
- Numeric precision/scale
- Cache-friendliness principles
- Layering / import direction rules
- Migration workflow
