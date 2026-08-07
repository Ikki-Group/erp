# ERD Documentation

Entity-Relationship Diagrams organized by domain.

## Notation

```
[table_name]          → table
  PK id               → primary key (serial)
  FK column           → foreign key
  -- column           → regular column
  UK column           → unique constraint
  ───── (solid)       → required FK (NOT NULL)
  - - - (dashed)      → optional FK (nullable)
```

## Documents

| File | Domain |
|------|--------|
| [core.md](./core.md) | Locations, IAM, Sessions, Company |
| [master-data.md](./master-data.md) | Materials, UoM (chain), Suppliers |
| [menu.md](./menu.md) | Menu Items, Modifiers, Recipes |
| [pos.md](./pos.md) | Orders, Payments, Shifts, Tables |
| [inventory.md](./inventory.md) | Stock, Movements, Transfers, Opname |
| [finance.md](./finance.md) | CoA, Journals, AP, Fiscal Periods |
| [hr.md](./hr.md) | Employees, Shifts, Attendance, Payroll |
| [crm.md](./crm.md) | Customers, Loyalty, Promotions |

## Cross-Domain FK Map

| From | To | Purpose |
|------|----|---------|
| orders.location_id | locations | POS scoped to store |
| orders.customer_id | customers | Loyalty link |
| order_lines.menu_item_id | menu_items | What was sold |
| stock_balances.location_id | locations | Stock per location |
| stock_balances.material_id | materials | Which material |
| transfer_requests.from_location_id | locations | Source |
| transfer_requests.to_location_id | locations | Destination |
| menu_items.location_id | locations | Menu per-location |
| recipes.menu_item_id | menu_items | BOM for item |
| recipe_lines.material_id | materials | Ingredient |
| journal_entries.location_id | locations | Scoped journals |
| employees.primary_location_id | locations | Primary workplace |
| cashier_shifts.location_id | locations | Shift at store |
| user_assignments.location_id | locations | Role per location |

---

**Next:** [core.md](./core.md) — Core domain ERD.
