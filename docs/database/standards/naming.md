# Naming Conventions

Rules for naming database objects and schema files.

---

## Database Objects

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | Plural snake_case | `sales_orders`, `material_categories` |
| Column names | Snake_case | `transaction_date`, `base_uom_id` |
| Foreign keys | `{table_singular}_id` | `location_id`, `material_id` |
| Indexes | `{table}_{columns}_idx` | `sales_orders_location_idx` |
| Check constraints | `{table}_{description}_chk` | `sales_orders_total_nonneg_chk` |
| Enums (pgEnum) | Snake_case, lowercase values | `pgEnum('order_status', ['open', 'closed'])` |

## TypeScript Variables

| Element | Convention | Example |
|---------|-----------|---------|
| Table export | `{pluralCamelCase}Table` | `salesOrdersTable` |
| Enum export | `{camelCase}Enum` | `salesOrderStatusEnum` |
| Type (select) | `typeof table.$inferSelect` | `type SalesOrder = ...` |
| Type (insert) | `typeof table.$inferInsert` | `type NewSalesOrder = ...` |

## Schema Files

| Rule | Example |
|------|---------|
| One file per domain module | `sales.ts`, `material.ts`, `hr.ts` |
| Internal helpers: underscore prefix | `_helpers.ts`, `_enums.ts`, `_relations.ts` |
| File maps 1:1 to `modules/{domain}/` | `iam.ts` → `modules/iam/` |
| Section comments separate groups | `// ─── Sales Orders ───` |

## File Internal Structure

```typescript
// 1. Imports (drizzle-orm, then internal refs)
// 2. Enums (before tables that use them)
// 3. Tables (ordered by dependency — parent first)
// 4. Type exports (if needed)
```
