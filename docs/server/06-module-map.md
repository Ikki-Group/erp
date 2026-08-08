# Module Map

Complete list of server modules, their types, entities, dependencies, and layer assignments.

## Layer Diagram

```
Layer 3  Aggregators
         └── reporting

Layer 2  Operations
         ├── pos/order
         ├── pos/shift
         ├── pos/table
         ├── pos/voucher
         ├── inventory/stock
         ├── inventory/transfer
         ├── inventory/opname
         ├── inventory/receiving
         ├── production
         ├── finance
         ├── hr
         └── crm

Layer 1  Master Data
         ├── location
         ├── iam
         ├── uom
         ├── material
         ├── supplier
         ├── menu
         ├── recipe
         └── payment-method

Layer 0  Core
         ├── auth
         ├── company
         └── audit
```

## Module Registry

### Layer 0 — Core

| Module    | Type   | Entities         | Description                               |
| --------- | ------ | ---------------- | ----------------------------------------- |
| `auth`    | Simple | sessions         | Login, logout, session management         |
| `company` | Simple | company_settings | Singleton company configuration           |
| `audit`   | Simple | audit_logs       | Audit log writes (infra) + read endpoints |

### Layer 1 — Master Data

| Module           | Type    | Entities                                                                            | Description                                        |
| ---------------- | ------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| `location`       | Simple  | locations                                                                           | Stores and warehouses                              |
| `iam`            | Complex | users, roles, user_assignments                                                      | Identity & access management                       |
| `uom`            | Simple  | uoms, uom_conversions                                                               | Units of measure + chain conversions               |
| `material`       | Medium  | materials, material_categories, material_locations                                  | Raw + semi-finished materials, location assignment |
| `supplier`       | Simple  | suppliers, supplier_materials                                                       | Vendor management + material pricing               |
| `menu`           | Complex | menu_items, menu_categories, modifier_groups, modifier_options, menu_item_modifiers | Per-location menu catalog + modifiers              |
| `recipe`         | Simple  | recipes, recipe_lines                                                               | Menu item BOM (links menu → materials)             |
| `payment-method` | Simple  | payment_methods, payment_method_locations                                           | Payment types + per-location config                |

### Layer 2 — Operations

| Module                | Type    | Entities                                                                                   | Description                        |
| --------------------- | ------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| `pos/order`           | Complex | orders, order_lines, payments                                                              | Order lifecycle, billing, payments |
| `pos/shift`           | Simple  | cashier_shifts                                                                             | Cashier shift open/close           |
| `pos/table`           | Simple  | tables                                                                                     | Dine-in table management           |
| `pos/voucher`         | Simple  | vouchers                                                                                   | Discount voucher codes             |
| `inventory/stock`     | Simple  | stock_balances, stock_movements                                                            | Real-time stock + movement history |
| `inventory/transfer`  | Simple  | transfer_requests, transfer_lines                                                          | Inter-location stock transfers     |
| `inventory/opname`    | Simple  | stock_opnames, stock_opname_lines                                                          | Physical count reconciliation      |
| `inventory/receiving` | Simple  | receivings, receiving_lines                                                                | Goods receipt from supplier        |
| `production`          | Simple  | production_recipes, production_recipe_lines, production_orders                             | Semi-finished item production      |
| `finance`             | Complex | accounts, journal_entries, journal_lines, accounts_payable, fiscal_periods                 | Double-entry accounting            |
| `hr`                  | Complex | employees, shift_templates, shift_assignments, attendances, payroll_runs, payslips, leaves | Staff management                   |
| `crm`                 | Complex | customers, loyalty_transactions, promotions                                                | Customer loyalty + promos          |

### Layer 3 — Aggregators

| Module      | Type       | Entities                   | Description                         |
| ----------- | ---------- | -------------------------- | ----------------------------------- |
| `reporting` | Aggregator | (none — reads from others) | Cross-module reports and dashboards |

## File Structure

### Simple Module

```
src/modules/location/
├── location.contract.ts
├── location.repo.ts
├── location.service.ts
├── location.route.ts
├── location.internal.ts
├── location.module.ts
└── index.ts
```

### Medium Module (multiple related entities, flat)

```
src/modules/material/
├── material.contract.ts
├── material.repo.ts
├── material.service.ts
├── material.route.ts
├── material.internal.ts
├── material.module.ts
├── category/
│   ├── category.contract.ts
│   ├── category.repo.ts
│   └── category.service.ts
├── assignment/
│   ├── assignment.contract.ts
│   ├── assignment.repo.ts
│   └── assignment.service.ts
└── index.ts
```

### Complex Module (sub-entities with composed reads)

```
src/modules/iam/
├── iam.module.ts
├── iam.route.ts
├── index.ts
├── user/
│   ├── user.contract.ts
│   ├── user.repo.ts
│   ├── user.service.ts
│   └── user.internal.ts
├── role/
│   ├── role.contract.ts
│   ├── role.repo.ts
│   ├── role.service.ts
│   └── role.internal.ts
├── assignment/
│   ├── assignment.contract.ts
│   ├── assignment.repo.ts
│   └── assignment.service.ts
└── composed/
    ├── composed.contract.ts
    ├── composed.repo.ts
    └── composed.service.ts
```

### Grouped Modules (POS, Inventory)

```
src/modules/pos/
├── pos.module.ts          (aggregates sub-module routes)
├── pos.route.ts
├── index.ts
├── order/
│   ├── order.contract.ts
│   ├── order.repo.ts
│   ├── order.service.ts
│   └── order.internal.ts
├── shift/
│   ├── shift.contract.ts
│   ├── shift.repo.ts
│   ├── shift.service.ts
│   └── shift.internal.ts
├── table/
│   └── ...
└── voucher/
    └── ...

src/modules/inventory/
├── inventory.module.ts
├── inventory.route.ts
├── index.ts
├── stock/
│   └── ...
├── transfer/
│   └── ...
├── opname/
│   └── ...
└── receiving/
    └── ...
```

## Dependency Rules

### Allowed

- Import **downward** (Layer 2 → Layer 1 → Layer 0).
- Same-layer imports within a group (e.g. `pos/order` → `pos/shift`).
- Same-layer imports across groups (e.g. `inventory/stock` → `production`).
- Cross-module via **service injection** (never direct repo access).

### Not Allowed

- Import **upward** (Layer 1 cannot import Layer 2).
- Direct access to another module's repository.
- Direct access to another module's database tables.

## Key Dependencies

```
pos/order → menu (read menu items)
pos/order → payment-method (read methods)
pos/order → pos/shift (validate active shift)
pos/order → pos/table (update table status)
pos/order → inventory/stock (auto-deduct via recipe)
pos/order → finance (auto-journal on complete)
pos/order → crm (earn loyalty points)
pos/order → recipe (lookup BOM for deduction)

inventory/receiving → material (validate assignment)
inventory/receiving → supplier (link to supplier)
inventory/receiving → inventory/stock (create movements)
inventory/receiving → finance (auto-journal)

inventory/transfer → material (validate assignment at destination)
inventory/transfer → inventory/stock (create movements)

production → material (validate semi_finished type)
production → inventory/stock (deduct inputs, add output)

finance → (standalone, triggered by others via service calls)

hr → location (employee assignment)
hr → finance (payroll → journal)
```

## Phase Mapping

| Phase | Modules                                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------------------- |
| 1     | auth, company, audit, location, iam, uom, material, supplier, menu, recipe, payment-method, pos/_, inventory/_, production |
| 2     | finance, hr                                                                                                                |
| 3     | crm, reporting                                                                                                             |

---

**Next:** [05-module-checklist.md](./05-module-checklist.md) — Step-by-step build guide.
