# Database Documentation

Index for all database documentation in Ikki ERP.

## Quick Facts

| Property            | Value                                    |
| ------------------- | ---------------------------------------- |
| Database            | PostgreSQL (Neon — serverless, freemium) |
| ORM                 | Drizzle (bun-sql driver)                 |
| Connection          | Neon pooled connection string            |
| Schema source       | `apps/server/src/db/schema/`             |
| Migrations          | `apps/server/drizzle/`                   |
| Primary keys        | Serial integer                           |
| Financial precision | `numeric(18,2)`                          |
| Quantity precision  | `numeric(18,6)`                          |
| Cache layer         | In-memory (single instance)              |
| Cache strategy      | Hybrid (event-based entity, TTL lists)   |

## Neon Considerations

| Aspect                        | Impact                              | Mitigation                              |
| ----------------------------- | ----------------------------------- | --------------------------------------- |
| Cold start (~1-3s after idle) | First request slow after inactivity | Accepted — freemium tier, no keep-alive |
| Network latency per query     | Every query = remote round-trip     | Aggressive caching, batch queries       |
| Connection pooling            | Required for performance            | Always use Neon pooled endpoint         |
| Compute cost                  | Charged per compute-time            | Fewer queries = lower cost              |
| Scale-to-zero                 | DB sleeps when idle                 | Acceptable for off-hours                |

## Structure

```
docs/database/
├── readme.md              ← you are here
├── caching.md             ← cache strategy per data type
├── erd/
│   ├── readme.md          ← notation + cross-domain FK map
│   ├── core.md            ← locations, IAM, sessions, company
│   ├── master-data.md     ← materials, UoM, suppliers
│   ├── menu.md            ← menu items, modifiers, recipes
│   ├── pos.md             ← orders, payments, shifts, tables
│   ├── inventory.md       ← stock, movements, transfers, opname
│   ├── finance.md         ← CoA, journals, AP, fiscal periods
│   ├── hr.md              ← employees, shifts, attendance, payroll
│   └── crm.md             ← customers, loyalty, promotions
└── standards/
    └── readme.md          ← naming, columns, constraints, indexes
```

## Domain Map

| Domain      | Key Tables                                                                                                                         | Scope                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Core        | locations, roles, users, user_assignments, sessions, company_settings                                                              | Global                |
| Master Data | materials, material_categories, material_locations, uoms, uom_conversions, suppliers, supplier_materials                           | Global                |
| Menu        | menu_items, menu_categories, modifier_groups, modifier_options, menu_item_modifiers, recipes, recipe_lines                         | Per-location          |
| POS         | orders, order_lines, payments, payment_methods, payment_method_locations, cashier_shifts, tables, vouchers                         | Per-location (store)  |
| Inventory   | stock_balances, stock_movements, transfer_requests, transfer_lines, stock_opnames, stock_opname_lines, receivings, receiving_lines | Per-location          |
| Production  | production_recipes, production_recipe_lines, production_orders                                                                     | Per-location          |
| Finance     | accounts, journal_entries, journal_lines, accounts_payable, fiscal_periods                                                         | Global + per-location |
| HR          | employees, shift_templates, shift_assignments, attendances, payroll_runs, payslips, leaves                                         | Per-location          |
| CRM         | customers, loyalty_transactions, promotions                                                                                        | Global                |

---

**Next:** [caching.md](./caching.md) — Cache strategy per data type.
