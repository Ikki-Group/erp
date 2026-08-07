# Database Standards

Naming conventions, column patterns, constraints, and index strategy.

## Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | Plural snake_case | `stock_movements`, `menu_items` |
| Columns | snake_case | `location_id`, `base_price` |
| Foreign keys | `{singular}_id` | `location_id`, `material_id` |
| Indexes | `{table}_{columns}_idx` | `orders_location_status_idx` |
| Unique | `{table}_{columns}_uniq` | `stock_balances_material_location_uniq` |
| Check | `{table}_{desc}_chk` | `stock_balances_qty_nonneg_chk` |

## Schema Files

| Rule | Example |
|------|---------|
| One file per domain | `location.ts`, `pos.ts`, `inventory.ts` |
| File maps to module | `pos.ts` → `modules/pos/` |
| Enums before tables | Define pgEnum, then reference in table |

## Column Patterns

### Primary Key

Always `serial` integer named `id`.

### Audit Stamps

Every mutable table:

```
created_at  timestamp  NOT NULL
created_by  integer    FK → users.id
updated_at  timestamp  NOT NULL
updated_by  integer    FK → users.id
```

### Numeric Precision

| Use | Type |
|-----|------|
| Money (price, salary) | `numeric(18,2)` |
| Quantity (stock, recipe) | `numeric(18,6)` |
| Percentage (tax rate) | `numeric(5,2)` |
| UoM factor | `numeric(18,6)` |

### Booleans

- Column name: `is_*` (e.g. `is_active`, `is_system`, `is_default`).
- Always `NOT NULL` with explicit default.

### JSONB

Only for truly variable-structure data:
- `order_lines.modifiers` — selected modifiers (denormalized snapshot)
- `roles.permissions` — permission string array

Never for relational data that should be a normalized FK.

## Constraints

### Foreign Keys

- Always index FK columns (Postgres does NOT auto-index).
- `onDelete` strategy per relationship:
  - Parent-child (order→lines): `CASCADE`
  - Reference (order→customer): `SET NULL` or `RESTRICT`
  - Critical (movement→material): `RESTRICT`

### Soft Delete

- Use `is_active` boolean (not `deleted_at` timestamp).
- Repos filter by `is_active = true` by default.
- Unique constraints may need partial index: `.where(eq(t.isActive, true))`.

### Check Constraints

- `stock_balances.quantity >= 0`
- `journal_lines`: NOT (debit > 0 AND credit > 0)
- `uom_conversions.factor > 0`
- `transfer_requests`: from_location_id != to_location_id

## Index Strategy

### Required Indexes

| Scenario | Type |
|----------|------|
| Every FK column | `index()` |
| Natural key / code | `uniqueIndex()` |
| Frequent filter (status, date) | `index()` |
| Composite lookup | Composite `index()` |

### Key Indexes

```
stock_balances: (material_id, location_id) UNIQUE
stock_movements: (material_id, location_id, created_at)
orders: (location_id, status, ordered_at)
order_lines: (order_id)
journal_lines: (entry_id)
attendances: (employee_id, date) UNIQUE
shift_assignments: (employee_id, date) UNIQUE
```

### Partial Unique

```
-- One active recipe per menu item
uniqueIndex on recipes(menu_item_id) WHERE is_active = true

-- SKU unique within location
uniqueIndex on menu_items(location_id, sku)
```

## Enum Strategy

- Domain-specific enums live in the same schema file as their table.
- Use `varchar` + CHECK constraint (not pgEnum) for flexibility.
- Values are lowercase snake_case strings.

---

**Next:** [../readme.md](../readme.md) — Back to database index.
