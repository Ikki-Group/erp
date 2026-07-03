# Schema Review: material.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

The material.ts file contains **5 tables**:

1. `materialCategoriesTable` - Classification/lookup table
2. `materialsTable` - Master material catalog
3. `materialConversionsTable` - UOM conversions
4. `materialLocationsTable` - Per-location config
5. `materialStockSnapshotsTable` - Projection/read model

---

## ✅ Strengths

### 1. **Outstanding Documentation** ⭐⭐⭐⭐⭐

Every table has comprehensive JSDoc explaining:

- Purpose and scope
- Field semantics
- Business rules
- Constraints
- Foreign key behaviors
- Service-layer invariants

**Example:**

```typescript
/**
 * Material Conversions Table
 *
 * Defines how alternative UOMs convert to the material's base UOM.
 * One-directional: always toBase. Inverse is computed at the application layer.
 *
 * Example: if baseUom = 'kg', a row {uomId: gram, toBaseFactor: 0.001} means
 *          1 gram = 0.001 kg.
 */
```

✅ **Excellent:** Context-rich, explains WHY not just WHAT

---

### 2. **CQRS/Event Sourcing Pattern** ⭐⭐⭐⭐⭐

**Separation of Concerns:**

```typescript
// Config layer (operator-owned, low churn)
materialLocationsTable: {
	;(minStock, maxStock, reorderPoint)
}

// Projection layer (event handler-owned, high churn)
materialStockSnapshotsTable: {
	;(currentQty, currentAvgCost, currentValue, snapshotAt)
}
```

**Benefits:**

- ✅ Eliminates lock contention between config edits and stock updates
- ✅ Snapshots can be rebuilt from event log
- ✅ Clear ownership boundaries

**✅ Excellent architecture!**

---

### 3. **Check Constraints for Data Integrity** ⭐⭐⭐⭐⭐

```typescript
// Conversions: factor must be positive
check('material_conversions_factor_chk', sql`to_base_factor > 0`)

// Stock snapshots: physical constraints
check('material_stock_snapshots_qty_chk', sql`current_qty >= 0`)
check('material_stock_snapshots_cost_chk', sql`current_avg_cost >= 0 AND current_value >= 0`)

// Location config: threshold relationships
check(
	'material_locations_stock_range_chk',
	sql`max_stock IS NULL OR (max_stock >= min_stock AND max_stock >= reorder_point)`,
)
```

✅ **Outstanding:** Business rules enforced at database level

---

### 4. **Partial Indexes for Soft Delete** ⭐⭐⭐⭐⭐

```typescript
// Materials table: allow SKU reuse after deactivation
uniqueIndex('materials_sku_active_idx')
	.on(t.sku)
	.where(sql`is_active = TRUE`)

uniqueIndex('materials_name_type_active_idx')
	.on(t.name, t.type)
	.where(sql`is_active = TRUE`)
```

✅ **Perfect use case for partial indexes:**

- Discontinued materials don't block identifier reuse
- Active materials still have unique constraints
- Flexible lifecycle management

---

### 5. **Foreign Key Strategy** ⭐⭐⭐⭐⭐

**Cascade (Child Owned by Parent):**

```typescript
// Material config/projections cascade with material
materialId: references(..., { onDelete: 'cascade' })
```

**Restrict (Requires Explicit Cleanup):**

```typescript
// Can't delete referenced categories, UOMs, locations
categoryId: references(..., { onDelete: 'restrict' })
locationId: references(..., { onDelete: 'restrict' })
```

✅ **Well-reasoned:** Matches data ownership patterns

---

### 6. **Numeric Precision** ⭐⭐⭐⭐⭐

```typescript
// Consistent precision across all quantity/cost fields
numeric('to_base_factor', { precision: 18, scale: 6 })
numeric('current_qty', { precision: 18, scale: 6 })
numeric('current_avg_cost', { precision: 18, scale: 6 })
```

✅ **Excellent:**

- Prevents precision loss in UOM conversions
- Handles fractional quantities (0.125 kg)
- Sufficient for ERP use cases

---

### 7. **Performance Indexes** ⭐⭐⭐⭐⭐

**Every foreign key has index:**

```typescript
index('materials_category_idx').on(t.categoryId)
index('materials_base_uom_idx').on(t.baseUomId)
index('material_conversions_uom_idx').on(t.uomId)
index('material_locations_location_idx').on(t.locationId)
index('material_stock_snapshots_location_idx').on(t.locationId)
```

**Operational queries optimized:**

```typescript
// Staleness detection for rebuild jobs
index('material_stock_snapshots_snapshot_at_idx').on(t.snapshotAt)
```

✅ **Complete coverage** for expected query patterns

---

## ⚠️ Issues & Improvements

### **CRITICAL: Non-Type-Safe Partial Indexes** 🔴

**Current Implementation:**

```typescript
// ❌ Using sql template (not type-safe)
uniqueIndex('materials_sku_active_idx')
	.on(t.sku)
	.where(sql`is_active = TRUE`)

uniqueIndex('materials_name_type_active_idx')
	.on(t.name, t.type)
	.where(sql`is_active = TRUE`)
```

**Should Use Type-Safe Pattern:**

```typescript
import { eq } from 'drizzle-orm'

// ✅ Type-safe with eq() operator
uniqueIndex('materials_sku_active_idx').on(t.sku).where(eq(t.isActive, true))

uniqueIndex('materials_name_type_active_idx').on(t.name, t.type).where(eq(t.isActive, true))
```

**Why This Matters:**

- ✅ Type checking catches errors at compile time
- ✅ Consistent with project patterns (learned from location review)
- ✅ Drizzle v1.0.0-rc.4+ supports `.where(eq(...))`

**Files to Update:**

- Import `eq` from `drizzle-orm`
- Update both partial indexes in `materialsTable`

---

### **DESIGN: Material Categories Lack isSystem Flag** 🟡

**Current:**

```typescript
materialCategoriesTable: {
	;(code, name, description)
	// No isSystem flag
}
```

**Question:** Should categories have `isSystem` flag?

**Considerations:**

| With `isSystem`                              | Without `isSystem`                  |
| -------------------------------------------- | ----------------------------------- |
| ✅ Protect seeded categories (RM, PKG, etc.) | ✅ Simpler schema                   |
| ✅ Consistent with roles/users/uoms pattern  | ⚠️ All categories deletable         |
| ⚠️ Extra field overhead                      | ⚠️ Service layer must block deletes |

**Comparison with Similar Tables:**

| Table              | Has isSystem? | Reason                           |
| ------------------ | ------------- | -------------------------------- |
| roles              | ✅ Yes        | Protect SUPER_ADMIN, ADMIN, etc. |
| users              | ✅ Yes        | Protect system users             |
| uoms               | ✅ Yes        | Protect KG, PCS, LTR, etc.       |
| materialCategories | ❌ No         | ?                                |

**Recommendation:** **Add `isSystem` flag for consistency**

```typescript
export const materialCategoriesTable = pgTable(
	'material_categories',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		description: text('description'),
		isSystem: boolean('is_system').notNull().default(false), // ✅ ADD
		...auditBasicColumns,
	},
	// ...
)
```

**Rationale:**

- Seeded categories ('RM', 'PKG', 'SEMI') should be protected
- Consistent with established pattern
- Service layer enforces deletion protection

**Impact:** ⭐⭐⭐ Consistency + protection for reference data

---

### **MINOR: Missing isActive on Categories** 🟢

**Current:**

```typescript
materialCategoriesTable: {
	// No isActive flag
}
```

**Question:** Should categories be soft-deletable?

**Considerations:**

| Need            | Reason                                       |
| --------------- | -------------------------------------------- |
| ❌ Probably NOT | Categories are stable reference data         |
| ❌ Probably NOT | Materials already have isActive (sufficient) |
| ⚠️ Edge Case    | Discontinue entire category?                 |

**Comparison:**

- ✅ `materials.isActive` - YES (products discontinued)
- ✅ `materialConversions.isActive` - YES (retire conversions)
- ❓ `materialCategories.isActive` - ? (rarely needed)

**Recommendation:** **Don't add isActive to categories**

**Rationale:**

- Categories are stable classification schemes
- If category is no longer used, materials already have isActive
- Simplicity wins (YAGNI principle)

**Impact:** N/A (no change needed)

---

### **MINOR: Documentation Typo/Clarity** 🟢

**In materialStockSnapshotsTable:**

```typescript
/**
 * `currentValue` — currentQty × currentAvgCost. Stored (not generated)
 *                  for query performance; always consistent with the other
 *                  two columns because all three are updated atomically
 *                  by the event handler.
 */
```

**Suggestion:** Add note about generated columns consideration

```typescript
/**
 * `currentValue` — currentQty × currentAvgCost. Stored (not generated column)
 *                  for query performance; always consistent with the other
 *                  two columns because all three are updated atomically
 *                  by the event handler.
 *
 *                  Note: PostgreSQL generated columns would be ideal here
 *                  (GENERATED ALWAYS AS (current_qty * current_avg_cost) STORED)
 *                  but Drizzle ORM doesn't support them yet (as of v0.30.x).
 *                  Manual consistency is maintained by the event handler.
 */
```

**Impact:** ⭐ Documentation clarity only

---

## 📝 Summary

| Category              | Rating     | Notes                          |
| --------------------- | ---------- | ------------------------------ |
| **Documentation**     | ⭐⭐⭐⭐⭐ | Outstanding clarity and detail |
| **Architecture**      | ⭐⭐⭐⭐⭐ | CQRS pattern perfectly applied |
| **Check Constraints** | ⭐⭐⭐⭐⭐ | Business rules enforced at DB  |
| **Partial Indexes**   | ⭐⭐⭐⭐   | **Use type-safe eq()**         |
| **Foreign Keys**      | ⭐⭐⭐⭐⭐ | Well-reasoned cascade/restrict |
| **Consistency**       | ⭐⭐⭐⭐   | **Add isSystem to categories** |
| **Overall**           | ⭐⭐⭐⭐⭐ | Excellent (after minor fixes)  |

---

## 🎯 Recommended Actions

### **Priority 1: Use Type-Safe Partial Indexes** 🔴

**Action:** Replace `sql` template with `eq()` operator

```typescript
import { eq, sql } from 'drizzle-orm' // ✅ Add eq import

// BEFORE:
uniqueIndex('materials_sku_active_idx')
	.on(t.sku)
	.where(sql`is_active = TRUE`)

uniqueIndex('materials_name_type_active_idx')
	.on(t.name, t.type)
	.where(sql`is_active = TRUE`)

// AFTER:
uniqueIndex('materials_sku_active_idx').on(t.sku).where(eq(t.isActive, true))

uniqueIndex('materials_name_type_active_idx').on(t.name, t.type).where(eq(t.isActive, true))
```

**Effort:** 2 minutes  
**Impact:** ⭐⭐⭐⭐⭐ Type safety + consistency

---

### **Priority 2: Add isSystem to Categories** 🟡

**Action:** Add system flag to materialCategoriesTable

```typescript
export const materialCategoriesTable = pgTable(
	'material_categories',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		description: text('description'),
		isSystem: boolean('is_system').notNull().default(false), // ✅ ADD
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('material_categories_code_idx').on(t.code),
		uniqueIndex('material_categories_name_idx').on(t.name),
	],
)
```

**Documentation Update:**

```typescript
/**
 * Material Categories Table
 *
 * Reference/lookup table for classifying materials.
 *
 * `code`     — stable, normalized machine identifier (e.g. 'RM', 'PKG').
 *              Used in seeding and application logic. Never changes after creation.
 * `name`     — human-readable display label. Unique and immutable after creation
 *              (rename via migration only, not a user-facing operation).
 * `isSystem` — true for categories created by the system seeder (e.g. RAW, SEMI, PKG).
 *              System categories are protected from update and deletion by the
 *              service layer. Mirrors the pattern on roles, users, and uoms tables.
 */
```

**Effort:** 3 minutes  
**Impact:** ⭐⭐⭐ Consistency with other reference tables

---

### **Priority 3: Documentation Enhancement** 🟢

**Action:** Add note about generated columns to currentValue field

**Effort:** 1 minute  
**Impact:** ⭐ Future maintainer clarity

---

## 💡 Schema Best Practices Applied

✅ **CQRS Separation** - Config vs Projection tables  
✅ **Check Constraints** - Business rules at DB level  
✅ **Partial Indexes** - Soft delete with unique constraints  
✅ **Numeric Precision** - Consistent scale: 6  
✅ **Foreign Key Strategy** - Cascade for owned, restrict for referenced  
✅ **Performance Indexes** - All FKs + operational queries covered  
⚠️ **Type Safety** - Use `eq()` not `sql` for partial indexes  
⚠️ **Naming Consistency** - Add `isSystem` to categories

---

## 🔍 Table-by-Table Analysis

### 1. materialCategoriesTable ⭐⭐⭐⭐

**Purpose:** Classification/lookup for materials

**Strengths:**

- ✅ Simple, focused schema
- ✅ Unique constraints on code and name
- ✅ Full audit columns

**Improvements:**

- ⚠️ Add `isSystem` flag for consistency

**Example Data:**

```sql
INSERT INTO material_categories (code, name, is_system) VALUES
  ('RM', 'Raw Materials', true),
  ('SEMI', 'Semi-Finished Goods', true),
  ('PKG', 'Packaging Materials', true),
  ('CHEM', 'Chemicals', false);  -- Custom category
```

---

### 2. materialsTable ⭐⭐⭐⭐⭐

**Purpose:** Master material catalog

**Strengths:**

- ✅ Excellent partial indexes for soft delete
- ✅ SKU as natural key
- ✅ Type enum for classification
- ✅ Base UOM reference

**Improvements:**

- ⚠️ Use `eq()` for type-safe partial indexes

**Example Data:**

```sql
INSERT INTO materials (sku, name, type, category_id, base_uom_id) VALUES
  ('RM-001', 'White Sugar', 'raw', 1, 1),      -- KG
  ('PKG-001', 'Plastic Bag', 'packaging', 3, 3); -- PCS
```

---

### 3. materialConversionsTable ⭐⭐⭐⭐⭐

**Purpose:** UOM conversions for materials

**Strengths:**

- ✅ Check constraint: factor > 0
- ✅ Unique on (materialId, uomId)
- ✅ Soft delete with isActive
- ✅ Documentation explains one-directional design

**No Changes Needed** ✅

**Example Data:**

```sql
-- Sugar: 1 G = 0.001 KG
INSERT INTO material_conversions (material_id, uom_id, to_base_factor) VALUES
  (1, 2, 0.001);  -- materialId=1 (sugar), uomId=2 (gram)
```

---

### 4. materialLocationsTable ⭐⭐⭐⭐⭐

**Purpose:** Per-location stock thresholds (config layer)

**Strengths:**

- ✅ Check constraint: stock range validation
- ✅ Separation from projection (no lock contention)
- ✅ Unique on (materialId, locationId)

**No Changes Needed** ✅

**Example Data:**

```sql
-- Sugar at Jakarta: min=10kg, reorder=25kg, max=100kg
INSERT INTO material_locations (material_id, location_id, min_stock, reorder_point, max_stock) VALUES
  (1, 1, 10, 25, 100);
```

---

### 5. materialStockSnapshotsTable ⭐⭐⭐⭐⭐

**Purpose:** Projection of current stock state

**Strengths:**

- ✅ CQRS read model
- ✅ Check constraints: qty ≥ 0, cost ≥ 0, value ≥ 0
- ✅ snapshotAt for staleness detection
- ✅ Separate from config (no lock contention)

**Minor Enhancement:**

- 🟢 Document why currentValue is stored not generated

**Example Data:**

```sql
-- Current stock: 50kg sugar @ 10.5/kg = 525 value
INSERT INTO material_stock_snapshots (material_id, location_id, current_qty, current_avg_cost, current_value) VALUES
  (1, 1, 50.000000, 10.500000, 525.000000);
```

---

## 🎯 Design Patterns Highlighted

### Pattern 1: CQRS/Event Sourcing ⭐⭐⭐⭐⭐

**Config Layer:**

```typescript
materialLocationsTable {
  minStock, maxStock, reorderPoint  // Operator-owned
}
```

**Projection Layer:**

```typescript
materialStockSnapshotsTable {
  currentQty, currentAvgCost, currentValue, snapshotAt  // Event handler-owned
}
```

**Benefits:**

- No lock contention between config edits and stock updates
- Snapshots can be rebuilt from event log
- Clear ownership and responsibility

---

### Pattern 2: Soft Delete with Partial Indexes ⭐⭐⭐⭐⭐

```typescript
// Allow SKU reuse after material deactivation
isActive: boolean('is_active').default(true)

uniqueIndex('materials_sku_active_idx').on(t.sku).where(eq(t.isActive, true)) // ✅ Only active materials must be unique
```

**Use Case:**

1. Material "Sugar v1" with SKU "RM-001" discontinued → `isActive = false`
2. New supplier: Material "Sugar v2" can reuse SKU "RM-001" → `isActive = true`
3. Unique constraint not violated (partial index only on active)

---

### Pattern 3: Check Constraints for Business Rules ⭐⭐⭐⭐⭐

```typescript
// Mathematical invariant: conversion factor must be positive
check('material_conversions_factor_chk', sql`to_base_factor > 0`)

// Physical invariant: stock can't be negative
check('material_stock_snapshots_qty_chk', sql`current_qty >= 0`)

// Business rule: threshold relationships
check(
	'material_locations_stock_range_chk',
	sql`max_stock IS NULL OR (max_stock >= min_stock AND max_stock >= reorder_point)`,
)
```

**Benefits:**

- Database enforces invariants (can't be bypassed)
- Fails fast on invalid data
- Self-documenting schema

---

## 🔗 Cross-Schema Dependencies

**Depends On:**

- ✅ `locationsTable` - Per-location config and projections
- ✅ `uomsTable` - Base UOM and conversions

**Used By:**

- Inventory module (stock movements)
- Purchasing module (PO line items)
- Production module (BOM recipes)
- Sales module (order line items)

---

## 🧪 Example Queries

### Query 1: Get Material with Conversions

```sql
SELECT
  m.sku,
  m.name,
  u.code as base_uom,
  json_agg(
    json_build_object(
      'uom', cu.code,
      'factor', mc.to_base_factor
    )
  ) as conversions
FROM materials m
JOIN uoms u ON m.base_uom_id = u.id
LEFT JOIN material_conversions mc ON m.id = mc.material_id AND mc.is_active
LEFT JOIN uoms cu ON mc.uom_id = cu.id
WHERE m.is_active
GROUP BY m.id, u.code;
```

---

### Query 2: Low Stock Alert

```sql
SELECT
  m.sku,
  m.name,
  l.name as location,
  s.current_qty,
  c.reorder_point
FROM material_stock_snapshots s
JOIN materials m ON s.material_id = m.id
JOIN locations l ON s.location_id = l.id
JOIN material_locations c ON m.id = c.material_id AND l.id = c.location_id
WHERE s.current_qty <= c.reorder_point
  AND m.is_active
ORDER BY (c.reorder_point - s.current_qty) DESC;
```

---

### Query 3: Stock Valuation Report

```sql
SELECT
  l.name as location,
  SUM(s.current_value) as total_value,
  COUNT(DISTINCT s.material_id) as material_count
FROM material_stock_snapshots s
JOIN locations l ON s.location_id = l.id
WHERE s.current_qty > 0
GROUP BY l.id, l.name
ORDER BY total_value DESC;
```

---

## 📊 Numeric Precision Analysis

**All Quantity/Cost Fields:**

```typescript
precision: 18, scale: 6
```

**Examples:**

```
999,999,999,999.999999  // Max value
0.000001                 // Min non-zero value (1 microgram in grams)
```

**Why Scale: 6?**

- ✅ Handles fractional quantities (0.125 kg)
- ✅ Precise UOM conversions (1g = 0.001 kg)
- ✅ Matches international standards (ISO 4217 extends to 6 decimals for precious metals)

**Trade-off:**

- ✅ More precision than typically needed (safe buffer)
- ⚠️ Slightly larger storage (acceptable for ERP)

---

**Status:** ✅ Schema is excellent, two minor improvements recommended  
**Next:** Apply type-safe indexes and add isSystem flag
