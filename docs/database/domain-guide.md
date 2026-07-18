# Domain Guide

Domain boundaries, ownership, data flow, and access rules for the Ikki ERP database.

---

## Dependency Hierarchy

```
Layer 3: Aggregators (Reporting, Dashboard — future)
Layer 2: Operations  (Sales, Purchasing, Production, Inventory, Payment, HR)
Layer 1: Master Data (Material, Product, CRM, Recipe, Sales Type)
Layer 0: Core        (IAM, Auth, Audit, Location, UOM, Supplier, Company, Tax)
```

Lower layers cannot import from upper layers. Same-layer may cross-reference.

## Schema File → Module Ownership

| File            | Module                | Key Tables                                      |
| --------------- | --------------------- | ----------------------------------------------- |
| `iam.ts`        | `modules/iam/`        | roles, users, user_assignments                  |
| `session.ts`    | `modules/auth/`       | sessions                                        |
| `audit.ts`      | `modules/audit/`      | audit_logs                                      |
| `location.ts`   | `modules/location/`   | locations                                       |
| `uom.ts`        | `modules/uom/`        | uoms                                            |
| `supplier.ts`   | `modules/supplier/`   | suppliers                                       |
| `company.ts`    | `modules/company/`    | company_settings                                |
| `sales-type.ts` | `modules/sales-type/` | sales_types                                     |
| `material.ts`   | `modules/material/`   | materials, conversions, locations, snapshots    |
| `product.ts`    | `modules/product/`    | products, variants, prices                      |
| `crm.ts`        | `modules/crm/`        | customers, loyalty_transactions                 |
| `recipe.ts`     | `modules/recipe/`     | recipes, recipe_items                           |
| `sales.ts`      | `modules/sales/`      | orders, items, invoices, voids, refunds         |
| `purchasing.ts` | `modules/purchasing/` | requests, POs, GRN, invoices                    |
| `inventory.ts`  | `modules/inventory/`  | transactions, adjustments, transfers, summaries |
| `production.ts` | `modules/production/` | work_orders                                     |
| `finance.ts`    | `modules/finance/`    | accounts, journals, expenditures                |
| `payment.ts`    | `modules/payment/`    | providers, methods, payments                    |
| `hr.ts`         | `modules/hr/`         | employees, attendance, payroll, leave           |
| `moka.ts`       | `modules/moka/`       | configurations, scrap, cursors                  |

## Access Rules

- Modules only **write** to their own tables.
- Cross-domain reads go through the other module's **service** (never direct repo query).
- Cross-domain side effects are triggered via service calls, not direct INSERT.

## Key Business Flows

### Sales

```
sales_orders → stock_transactions(sell) → customer_loyalty → sales_invoices → payments
```

### Purchasing

```
purchase_requests → purchase_orders → goods_receipt_notes → stock_transactions(purchase) → purchase_invoices → payments
```

### Production

```
recipes → work_orders → stock_transactions(production_out) → stock_transactions(production_in)
```

### Inventory Transfer

```
stock_transfers(pending) → approved → stock_transactions(transfer_out) → completed → stock_transactions(transfer_in)
```

## Location-Based Access (LBAC)

Most operational tables have a `location_id` FK. User access is scoped via `user_assignments(user_id, location_id)`.

| Scope        | Examples                                                |
| ------------ | ------------------------------------------------------- |
| Per-location | products, sales_orders, stock_transactions, attendances |
| Global       | materials, uoms, roles, suppliers, accounts, recipes    |
| Hybrid       | sales_types (null location = global)                    |

## Immutable History

These columns capture point-in-time values that never update:

- `sales_order_items.item_name` / `unit_price` — product renames don't affect history
- `sales_order_items.product_sku` / `variant_name` — full decoupling from product table
- `purchase_order_items.item_name` / `unit_price` — PO terms are locked
- `stock_transactions.unit_cost` / `running_qty` — ledger entries are append-only

## Schema-Only Tables (no module yet)

| Table                     | Notes                                |
| ------------------------- | ------------------------------------ |
| purchase_requests + items | FK exists from purchase_orders       |
| purchase_invoices + items | payment_invoices FK anticipates this |
| stock_batches             | Batch/lot tracking not wired         |
| taxes                     | products.taxId commented out         |

## Adding a New Domain

1. Create `apps/server/src/db/schema/{domain}.ts`
2. Export from `schema/index.ts` in correct group
3. Run `bun run db:generate` → `bun run db:migrate`
4. Create `modules/{domain}/` (repo, service, contract, route)
5. Update this documentation
