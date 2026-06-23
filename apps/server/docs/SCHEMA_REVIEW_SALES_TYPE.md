# Schema Review: sales-type.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

The sales-type.ts file contains **1 table**:
1. `salesTypesTable` - Sales channel/pricing context (Dine In, Takeaway, Delivery, etc.)

---

## ✅ Strengths

### 1. **Outstanding Documentation** ⭐⭐⭐⭐⭐

```typescript
/**
 * Sales Types Table
 *
 * Defines the channel or pricing context of a sale (e.g. Dine In, Takeaway,
 * Delivery, Wholesale). Used as the discriminator for per-sales-type pricing
 * in productPricesTable and variantPricesTable.
 *
 * Two tiers:
 *
 *   Global (locationId = null)
 *     — Shared across all locations. Always seeded (isBuiltIn = true).
 *     — Typical examples: 'DINE_IN', 'TAKEAWAY', 'DELIVERY'.
 *     — `code` unique among all global rows (partial unique index).
 *
 *   Per-location (locationId IS NOT NULL)
 *     — Custom sales types created by location operators.
 *     — Always isBuiltIn = false.
 *     — `code` unique within the same location (partial unique index).
 *     — Two locations may share the same code (e.g. both have 'WHOLESALE').
 */
```

✅ **Excellent:** Explains two-tier architecture clearly

---

### 2. **Two-Tier Architecture** ⭐⭐⭐⭐⭐

**Global Sales Types (locationId = null):**
```typescript
// System-wide, shared across all locations
{ code: 'DINE_IN', name: 'Dine In', isBuiltIn: true, locationId: null }
{ code: 'TAKEAWAY', name: 'Takeaway', isBuiltIn: true, locationId: null }
{ code: 'DELIVERY', name: 'Delivery', isBuiltIn: true, locationId: null }
```

**Per-Location Sales Types (locationId IS NOT NULL):**
```typescript
// Jakarta-specific
{ code: 'WHOLESALE', name: 'Wholesale Jakarta', isBuiltIn: false, locationId: 1 }

// Bali-specific (same code, different location)
{ code: 'WHOLESALE', name: 'Wholesale Bali', isBuiltIn: false, locationId: 2 }
```

✅ **Perfect:** Balances shared standards with location flexibility

---

### 3. **Clever Partial Indexes** ⭐⭐⭐⭐⭐

**Global Uniqueness:**
```typescript
uniqueIndex('sales_types_global_code_idx')
  .on(t.code)
  .where(sql`location_id IS NULL`)

uniqueIndex('sales_types_global_name_idx')
  .on(t.name)
  .where(sql`location_id IS NULL`)
```

**Per-Location Uniqueness:**
```typescript
uniqueIndex('sales_types_location_code_idx')
  .on(t.locationId, t.code)
  .where(sql`location_id IS NOT NULL`)

uniqueIndex('sales_types_location_name_idx')
  .on(t.locationId, t.name)
  .where(sql`location_id IS NOT NULL`)
```

✅ **Excellent:** Prevents conflicts at both global and location level

---

### 4. **Check Constraint for Business Rule** ⭐⭐⭐⭐⭐

```typescript
// isBuiltIn types are always global — locationId must be null
check('sales_types_built_in_global_chk', sql`NOT is_built_in OR location_id IS NULL`)
```

**Enforces Invariant:**
- If `isBuiltIn = true`, then `locationId` MUST be `null`
- Prevents invalid state (built-in + location-specific)

✅ **Perfect:** Database-level enforcement of business logic

---

## ⚠️ Issues & Improvements

### **CRITICAL: Field Name Mismatch** 🔴

**Current:**
```typescript
isBuiltIn: boolean('is_built_in').notNull().default(false)
```

**Should Be (Consistency):**
```typescript
isSystem: boolean('is_system').notNull().default(false)
```

**Why:**
- All other tables use `isSystem` (roles, users, uoms)
- "System-seeded" more accurate than "built-in"
- Consistency across codebase

**Update Documentation:**
```typescript
/**
 * `isSystem` — true for seeder-created global sales types. Protected from
 *              update and deletion by the service layer. Mirrors the pattern
 *              on roles, users, and uoms tables.
 *              Invariant: isSystem = true → locationId IS NULL.
 *              Enforced via check constraint.
 */
```

**Update Check Constraint:**
```typescript
check('sales_types_system_global_chk', sql`NOT is_system OR location_id IS NULL`)
```

**Impact:** ⭐⭐⭐⭐⭐ Critical for consistency

---

### **CRITICAL: Non-Type-Safe Partial Indexes** 🔴

**Current Implementation:**
```typescript
// ❌ Using sql template (not type-safe)
uniqueIndex('sales_types_global_code_idx')
  .on(t.code)
  .where(sql`location_id IS NULL`)

uniqueIndex('sales_types_location_code_idx')
  .on(t.locationId, t.code)
  .where(sql`location_id IS NOT NULL`)
```

**Should Use Type-Safe Pattern:**
```typescript
import { isNull, isNotNull } from 'drizzle-orm'

// ✅ Type-safe with isNull() and isNotNull()
uniqueIndex('sales_types_global_code_idx')
  .on(t.code)
  .where(isNull(t.locationId))

uniqueIndex('sales_types_location_code_idx')
  .on(t.locationId, t.code)
  .where(isNotNull(t.locationId))
```

**Why This Matters:**
- ✅ Type checking catches errors at compile time
- ✅ Consistent with project patterns (all other schemas)
- ✅ Drizzle v1.0.0-rc.4+ supports `.where(isNull(...))`

**Files to Update:**
- Import `isNull`, `isNotNull` from `drizzle-orm`
- Update all 4 partial indexes

**Impact:** ⭐⭐⭐⭐⭐ Type safety + consistency

---

### **DESIGN: Check Constraint Update** 🟡

**Current:**
```typescript
check('sales_types_built_in_global_chk', sql`NOT is_built_in OR location_id IS NULL`)
```

**After Rename:**
```typescript
check('sales_types_system_global_chk', sql`NOT is_system OR location_id IS NULL`)
```

**Impact:** ⭐⭐⭐ Consistency (follows from field rename)

---

## 📝 Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Documentation** | ⭐⭐⭐⭐⭐ | Outstanding clarity |
| **Two-Tier Architecture** | ⭐⭐⭐⭐⭐ | Perfect design |
| **Partial Indexes** | ⭐⭐⭐⭐ | **Use type-safe isNull()/isNotNull()** |
| **Check Constraint** | ⭐⭐⭐⭐⭐ | Business rule enforced |
| **Naming** | ⭐⭐⭐ | **isBuiltIn → isSystem** |
| **Overall** | ⭐⭐⭐⭐⭐ | Excellent (after fixes) |

---

## 🎯 Recommended Actions

### **Priority 1: Rename isBuiltIn to isSystem** 🔴

**Action:** Consistent naming across all tables

```typescript
// BEFORE:
isBuiltIn: boolean('is_built_in').notNull().default(false)

// AFTER:
isSystem: boolean('is_system').notNull().default(false)
```

**Update Check Constraint:**
```typescript
// BEFORE:
check('sales_types_built_in_global_chk', sql`NOT is_built_in OR location_id IS NULL`)

// AFTER:
check('sales_types_system_global_chk', sql`NOT is_system OR location_id IS NULL`)
```

**Update Documentation:**
- Replace all `isBuiltIn` references with `isSystem`
- Update comments to match roles/users/uoms pattern

**Effort:** 3 minutes  
**Impact:** ⭐⭐⭐⭐⭐ Consistency across codebase

---

### **Priority 2: Use Type-Safe Partial Indexes** 🔴

**Action:** Replace `sql` template with `isNull()` and `isNotNull()` operators

```typescript
import { isNull, isNotNull, sql } from 'drizzle-orm'

// BEFORE (4 indexes):
.where(sql`location_id IS NULL`)
.where(sql`location_id IS NOT NULL`)

// AFTER:
.where(isNull(t.locationId))
.where(isNotNull(t.locationId))
```

**Affected Indexes:**
- `sales_types_global_code_idx`
- `sales_types_global_name_idx`
- `sales_types_location_code_idx`
- `sales_types_location_name_idx`

**Effort:** 3 minutes  
**Impact:** ⭐⭐⭐⭐⭐ Type safety + consistency

---

### **Priority 3: No Other Changes Needed** ✅

**Schema is excellent as-is:**
- ✅ Two-tier architecture perfect
- ✅ Check constraint enforces business rule
- ✅ Documentation outstanding
- ✅ Foreign key strategy correct

---

## 💡 Schema Best Practices Applied

✅ **Two-Tier Architecture** - Global + per-location flexibility  
✅ **Partial Indexes** - Separate uniqueness for global vs location  
✅ **Check Constraint** - Business rule enforced at DB  
✅ **Documentation** - Comprehensive explanation  
⚠️ **Type Safety** - Use `isNull()`/`isNotNull()` not `sql`  
⚠️ **Naming Consistency** - `isSystem` not `isBuiltIn`

---

## 🔍 Detailed Analysis

### Table: salesTypesTable ⭐⭐⭐⭐⭐

**Purpose:** Sales channel/pricing context definitions

**Strengths:**
- ✅ Two-tier design (global + per-location)
- ✅ 4 partial unique indexes (code/name x global/location)
- ✅ Check constraint enforces invariant
- ✅ Full audit columns

**Improvements:**
- ⚠️ Rename `isBuiltIn` → `isSystem`
- ⚠️ Use type-safe partial indexes

**Example Data:**

**Global Sales Types:**
```sql
INSERT INTO sales_types (code, name, is_system, location_id) VALUES
  ('DINE_IN', 'Dine In', true, NULL),
  ('TAKEAWAY', 'Takeaway', true, NULL),
  ('DELIVERY', 'Delivery', true, NULL);
```

**Per-Location Sales Types:**
```sql
-- Jakarta custom sales type
INSERT INTO sales_types (code, name, is_system, location_id) VALUES
  ('WHOLESALE', 'Wholesale Jakarta', false, 1);

-- Bali custom sales type (same code, different location)
INSERT INTO sales_types (code, name, is_system, location_id) VALUES
  ('WHOLESALE', 'Wholesale Bali', false, 2);

-- ✅ Allowed: Same code at different locations
```

---

## 🎯 Design Patterns Highlighted

### Pattern 1: Two-Tier Reference Data ⭐⭐⭐⭐⭐

**Global Tier (Shared):**
```typescript
locationId: null  // Shared across all locations
isSystem: true    // Protected, seeded
```

**Per-Location Tier (Custom):**
```typescript
locationId: 1     // Specific to Jakarta
isSystem: false   // Custom, editable
```

**Benefits:**
- ✅ Consistency: Standard sales types shared
- ✅ Flexibility: Locations can create custom types
- ✅ No duplication: Global types used by all

**Use Cases:**
- Global: DINE_IN, TAKEAWAY, DELIVERY (standard)
- Per-location: WHOLESALE_VIP, CORPORATE_DEAL (custom)

---

### Pattern 2: Partial Indexes for Two Tiers ⭐⭐⭐⭐⭐

**Global Uniqueness:**
```typescript
// Among global types (locationId IS NULL), code must be unique
uniqueIndex('sales_types_global_code_idx')
  .on(t.code)
  .where(isNull(t.locationId))  // ✅ After fix
```

**Per-Location Uniqueness:**
```typescript
// Within same location, code must be unique
// But different locations CAN have same code
uniqueIndex('sales_types_location_code_idx')
  .on(t.locationId, t.code)
  .where(isNotNull(t.locationId))  // ✅ After fix
```

**Example:**
```sql
-- ✅ Allowed: Same code in different locations
INSERT INTO sales_types (code, name, location_id) VALUES
  ('WHOLESALE', 'Wholesale Jakarta', 1),
  ('WHOLESALE', 'Wholesale Bali', 2);

-- ❌ Rejected: Duplicate code in same location
INSERT INTO sales_types (code, name, location_id) VALUES
  ('WHOLESALE', 'Wholesale B2B', 1);
-- ERROR: duplicate key value violates unique constraint "sales_types_location_code_idx"

-- ❌ Rejected: Duplicate global code
INSERT INTO sales_types (code, name, location_id) VALUES
  ('DINE_IN', 'Dine In V2', NULL);
-- ERROR: duplicate key value violates unique constraint "sales_types_global_code_idx"
```

---

### Pattern 3: Check Constraint for Invariant ⭐⭐⭐⭐⭐

**Business Rule:**
> "System-seeded sales types are always global (not location-specific)"

**SQL Expression:**
```sql
NOT is_system OR location_id IS NULL
```

**Truth Table:**

| isSystem | locationId | Valid? | Reason |
|----------|------------|--------|--------|
| false | NULL | ✅ Yes | Custom global (unusual but allowed) |
| false | 1 | ✅ Yes | Custom per-location (typical) |
| true | NULL | ✅ Yes | System global (typical) |
| true | 1 | ❌ NO | System types cannot be location-specific |

**Database Enforcement:**
```sql
-- ✅ Allowed: System global
INSERT INTO sales_types (code, name, is_system, location_id) VALUES
  ('DINE_IN', 'Dine In', true, NULL);

-- ❌ Rejected: System types cannot have locationId
INSERT INTO sales_types (code, name, is_system, location_id) VALUES
  ('CUSTOM', 'Custom Type', true, 1);
-- ERROR: check constraint "sales_types_system_global_chk" violated
```

---

## 🔗 Cross-Schema Dependencies

**Depends On:**
- ✅ `locationsTable` - Per-location sales types

**Used By:**
- ✅ `salesOrdersTable` - Which sales type was used
- ✅ `productPricesTable` - Per-sales-type pricing (non-variant)
- ✅ `productVariantPricesTable` - Per-sales-type pricing (variant)

---

## 🧪 Example Queries

### Query 1: Get All Sales Types for Location
```sql
-- Get all available sales types for Jakarta (ID=1)
-- Includes both global types and Jakarta-specific types
SELECT 
  code,
  name,
  CASE 
    WHEN location_id IS NULL THEN 'Global'
    ELSE 'Location-Specific'
  END as tier
FROM sales_types
WHERE location_id IS NULL  -- Global types
   OR location_id = 1      -- Jakarta-specific types
ORDER BY tier, code;
```

---

### Query 2: Check for Duplicate Codes
```sql
-- Find locations with same sales type codes
SELECT 
  code,
  COUNT(*) as location_count,
  array_agg(location_id ORDER BY location_id) as locations
FROM sales_types
WHERE location_id IS NOT NULL
GROUP BY code
HAVING COUNT(*) > 1;
```

---

### Query 3: System vs Custom Types
```sql
SELECT 
  CASE 
    WHEN is_system THEN 'System'
    ELSE 'Custom'
  END as type_category,
  COUNT(*) as count
FROM sales_types
GROUP BY is_system
ORDER BY is_system DESC;
```

---

## 🎓 Key Learnings

### 1. **Two-Tier Reference Data Pattern**

**When to Use:**
- Reference data needs both standard and custom values
- Standard values shared across entities (locations, tenants)
- Custom values specific to entity

**Examples in This Codebase:**
- ✅ `salesTypesTable` - Global + per-location
- ❓ Could apply to: categories, tags, custom fields

---

### 2. **Partial Indexes for Tiered Uniqueness**

**Pattern:**
```typescript
// Tier 1: Global uniqueness
uniqueIndex().on(t.code).where(isNull(t.scopeField))

// Tier 2: Scoped uniqueness
uniqueIndex().on(t.scopeField, t.code).where(isNotNull(t.scopeField))
```

**Benefits:**
- ✅ Enforces uniqueness at correct level
- ✅ Allows same code in different scopes
- ✅ Database-level enforcement

---

### 3. **Check Constraints for Cross-Field Rules**

**Pattern:**
```typescript
// "If A is true, then B must be null"
check('name', sql`NOT field_a OR field_b IS NULL`)
```

**Benefits:**
- ✅ Enforces complex business rules
- ✅ Cannot be bypassed
- ✅ Self-documenting schema

---

## 📊 Comparison with Other Schemas

| Schema | Architecture | isSystem Field | Notes |
|--------|--------------|----------------|-------|
| **salesTypes** | Two-tier (global + per-location) | ✅ Yes (after fix) | Flexible pricing |
| **roles** | Global only | ✅ Yes | System-wide permissions |
| **uoms** | Global only | ✅ Yes | Universal measurements |
| **productCategories** | Per-location only | ❌ No | Location-specific catalog |
| **materialCategories** | Global only | ❌ No (should add?) | Universal classification |

**Design Decision Rationale:**
- Sales types need flexibility (global standards + local customization)
- UOMs are universal (KG is KG everywhere)
- Product categories are local (each store has unique catalog)

---

**Status:** ✅ Schema is excellent, two improvements recommended  
**Next:** Apply fixes (rename isBuiltIn → isSystem, use type-safe partial indexes)
