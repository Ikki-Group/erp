# Database Documentation

Index for all database documentation in Ikki ERP.

## Quick Facts

| Property | Value |
|----------|-------|
| Database | PostgreSQL |
| ORM | Drizzle (bun-sql driver) |
| Schema source | `apps/server/src/db/schema/` |
| Migrations | `apps/server/drizzle/` |
| Primary keys | Serial integer |
| Financial precision | `numeric(18,2)` |
| Quantity precision | `numeric(18,6)` |

## Structure

```
docs/database/
├── readme.md           ← you are here
├── erd/
│   ├── readme.md       ← notation + cross-domain FK map
│   ├── core.md         ← locations, IAM, sessions, company
│   ├── master-data.md  ← materials, UoM, suppliers
│   ├── menu.md         ← menu items, modifiers, recipes
│   ├── pos.md          ← orders, payments, shifts, tables
│   ├── inventory.md    ← stock, movements, transfers, opname
│   ├── finance.md      ← CoA, journals, AP, fiscal periods
│   ├── hr.md           ← employees, shifts, attendance, payroll
│   └── crm.md          ← customers, loyalty, promotions
└── standards/
    └── readme.md       ← naming, columns, constraints, indexes
```

## Domain Map

| Domain | Key Tables | Scope |
|--------|-----------|-------|
| Core | locations, roles, users, user_assignments, sessions, company_settings | Global |
| Master Data | materials, material_categories, uoms, uom_conversions, suppliers, supplier_materials | Global |
| Menu | menu_items, menu_categories, modifier_groups, modifier_options, menu_item_modifiers, recipes, recipe_lines | Per-location |
| POS | orders, order_lines, payments, payment_methods, payment_method_locations, cashier_shifts, tables | Per-location (store) |
| Inventory | stock_balances, stock_movements, transfer_requests, transfer_lines, stock_opnames, stock_opname_lines, receivings, receiving_lines | Per-location |
| Finance | accounts, journal_entries, journal_lines, accounts_payable, fiscal_periods | Global + per-location |
| HR | employees, shift_templates, shift_assignments, attendances, payroll_runs, payslips, leaves | Per-location |
| CRM | customers, loyalty_transactions, promotions | Global |

---

**Next:** [erd/readme.md](./erd/readme.md) — ERD notation and cross-domain map.
