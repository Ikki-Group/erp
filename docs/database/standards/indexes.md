# Index Strategy

Rules for creating and naming indexes.

---

## Required Indexes

| Scenario | Type |
|----------|------|
| Every FK column | `index()` |
| Natural key / code | `uniqueIndex()` |
| Frequent filter (status, date, type) | `index()` |
| Composite lookup (material + location + date) | Composite `index()` |
| Soft-delete aware unique | Partial `.where(isNull(t.deletedAt))` |
| Active-only unique | Partial `.where(eq(t.isActive, true))` |

## Naming

Pattern: `{table}_{columns}_idx`

```typescript
index('sales_orders_location_idx').on(t.locationId)
uniqueIndex('materials_sku_active_idx').on(t.sku).where(eq(t.isActive, true))
```

## Partial Unique Indexes

Used when uniqueness applies only to a subset of rows:

```typescript
// SKU unique only among active materials (allows reuse after deactivation)
uniqueIndex('materials_sku_active_idx').on(t.sku).where(eq(t.isActive, true))

// Code unique only among non-deleted suppliers
uniqueIndex('suppliers_code_idx').on(t.code).where(isNull(t.deletedAt))

// Exactly one default variant per product
uniqueIndex('product_variants_default_idx').on(t.productId).where(eq(t.isDefault, true))
```

## Composite Indexes

Follow leftmost prefix rule. Order columns by selectivity (most selective first in queries):

```typescript
// Hot path: "stock at location on date"
index('stock_txn_material_location_date_idx').on(t.materialId, t.locationId, t.date)

// Filter: "active products at location"
index('products_location_status_idx').on(t.locationId, t.status)
```

## Rules

- Postgres does NOT auto-index FK columns — always add explicitly.
- Index names match the column(s) they cover.
- Comment hot-path indexes in schema for discoverability.
- Avoid over-indexing: only index columns actually queried in WHERE/JOIN.
