# Schema Review: location.ts

**Date:** 2026-06-22  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

```typescript
export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])

export const locationsTable = pgTable(
  'locations',
  {
    ...pk,                              // id: serial
    code: text('code').notNull(),
    name: text('name').notNull(),
    type: locationTypeEnum('type').notNull(),
    description: text('description'),
    address: text('address'),           // ✅ PRESENT (contradicts comment)
    phone: text('phone'),               // ✅ PRESENT (contradicts comment)
    isActive: boolean('is_active').notNull().default(true),
    ...auditBasicColumns,               // createdAt, updatedAt, createdBy, updatedBy
  },
  (t) => [
    uniqueIndex('locations_code_active_idx').on(t.code),
    uniqueIndex('locations_name_active_idx').on(t.name),
  ],
)
```

---

## ✅ Strengths

### 1. **Documentation Quality** ⭐⭐⭐⭐⭐
```typescript
/**
 * Locations Table
 *
 * Represents a physical operational site (store, warehouse, etc.).
 * Central anchor for LBAC — users are granted roles per location.
 *
 * `code`      — required, normalized/slug identifier (e.g. "JKT-001").
 *               Unique among active locations. Stable after creation.
 *
 * `name`      — human-readable display name. Unique among active locations.
 *               Both `code` and `name` use partial unique indexes scoped to
 *               `is_active = TRUE` so decommissioned locations don't block
 *               reuse of the same code/name for a new site.
 * ...
 */
```

**✅ Excellent:** Clear business rules, constraints explained, usage documented

---

### 2. **Proper Audit Trail** ⭐⭐⭐⭐⭐
```typescript
...auditBasicColumns,  // createdAt, updatedAt, createdBy, updatedBy
```

**✅ Good:** Full audit trail for compliance and debugging

---

### 3. **Type Safety** ⭐⭐⭐⭐⭐
```typescript
export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])
type: locationTypeEnum('type').notNull(),
```

**✅ Excellent:** 
- PostgreSQL enum (database-level constraint)
- Matches Zod enum in contract
- Type-safe in TypeScript
- Prevents invalid values at DB level

---

### 4. **Soft Delete Pattern** ⭐⭐⭐⭐⭐
```typescript
isActive: boolean('is_active').notNull().default(true),
```

**✅ Good:** Allows location decommissioning without data loss

---

### 5. **Serial PK** ⭐⭐⭐⭐⭐
```typescript
...pk,  // id: serial('id').primaryKey()
```

**✅ Optimal for solo developer:**
- Smaller indexes (4 bytes vs 16 for UUID)
- Human-readable IDs
- Simpler debugging
- Faster joins

---

## ⚠️ Issues & Improvements

### **RESOLVED: Simple Unique Indexes Sufficient** ✅

**Current Implementation:**
```typescript
uniqueIndex('locations_code_idx').on(t.code),
uniqueIndex('locations_name_idx').on(t.name),
```

**Design Decision:**
- Unique constraint applies to **ALL rows** (active + inactive)
- Location codes are **permanent identifiers** - never reused
- Historical data integrity preserved
- Simpler schema without partial indexes

**Rationale:**
- Location code represents physical site identity
- Historical records (orders, inventory) reference location by code
- Reusing codes would create ambiguity in reports
- If location reopens, use new code (e.g., JKT-001 → JKT-001-V2)

---

**Impact:**

| Scenario | Behavior | Reason |
|----------|----------|--------|
| Close store "JKT-001" | `isActive = false` | ✅ Store deactivated |
| Reopen store "JKT-001" | ❌ **Use new code** | Historical integrity |
| Historical queries | ✅ Unambiguous | Each code = one location |

**Business Benefits:**
- Clear historical data (JKT-001 always refers to same physical site)
- No confusion in reports/analytics
- Audit trail preserved
- Simple schema (no partial indexes needed)

---

**Drizzle Support (v1.0.0-rc.4+):**

Drizzle ORM **DOES support** partial indexes with `.where()` clause:

```typescript
// ✅ SUPPORTED IN DRIZZLE v1.0.0-rc.4+
import { sql } from 'drizzle-orm'

uniqueIndex('locations_code_active_idx')
  .on(t.code)
  .where(sql`${t.isActive} = true`)
```

---

**Solution: Simple Global Unique Indexes** ⭐⭐⭐⭐⭐ (Implemented)

**Implementation:**
```typescript
export const locationsTable = pgTable(
  'locations',
  {
    ...pk,
    code: text('code').notNull(),
    name: text('name').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    // ...
  },
  (t) => [
    uniqueIndex('locations_code_idx').on(t.code),
    uniqueIndex('locations_name_idx').on(t.name),
  ],
)
```

**Pros:**
- ✅ Simple schema design
- ✅ Historical data integrity
- ✅ No ambiguity in reports
- ✅ Type-safe
- ✅ No partial index complexity

**Design Note:**
Location codes are permanent identifiers. If a physical site reopens,
use a new code (e.g., JKT-001 → JKT-001-V2) to maintain historical clarity.

**Type-Safe Partial Index (if needed in future):**
```typescript
import { eq } from 'drizzle-orm'

uniqueIndex('locations_code_active_idx')
  .on(t.code)
  .where(eq(t.isActive, true))  // ✅ Type-safe with eq()
```

---

#### **Alternative: Composite Unique** ⭐⭐⭐ (Not Recommended)

**Pros:**
- ✅ Supported in Drizzle
- ✅ Type-safe
- ✅ Visible in schema

**Cons:**
- ❌ Changes data model
- ❌ Requires `code + isActive` in uniqueness check
- ❌ Weird semantics (`JKT-001-true` vs `JKT-001-false`)

**Implementation:**
```typescript
(t) => [
  uniqueIndex('locations_code_active_idx').on(t.code, t.isActive),
  uniqueIndex('locations_name_active_idx').on(t.name, t.isActive),
]
```

**Problem:** Allows multiple inactive locations with same code (`JKT-001, false` + `JKT-001, false`)

---

#### **Alternative: Accept Non-Partial Behavior** ⭐ (Not Recommended)

**Pros:**
- ✅ No changes needed
- ✅ Simpler

**Cons:**
- ❌ **Contradicts documentation**
- ❌ Cannot reuse location codes
- ❌ Business limitation

**Action:** Update documentation to match implementation:
```typescript
/**
 * `code` — required, normalized identifier.
 *          Unique across ALL locations (active + inactive).
 *          Once used, a code cannot be reused even after deactivation.
 */
```

---

**✅ IMPLEMENTED:** Simple global unique indexes
- Location codes are permanent (historical integrity)
- Clean schema design
- No partial index complexity needed
- Type-safe and straightforward

**Learning:** Drizzle supports type-safe partial indexes via `eq()`:
```typescript
import { eq } from 'drizzle-orm'
uniqueIndex().on(t.code).where(eq(t.isActive, true))
```

---

### **MINOR: Missing Column Validation** 🟡

**Issue:** No validation on `code` format

**Current:**
```typescript
code: text('code').notNull(),
```

**Contract Validation:**
```typescript
// location.contract.ts
code: zc.strTrim,  // Just trims whitespace, no format validation
```

**Recommendation:** Add constraint or validation

#### Option A: Database Check Constraint
```typescript
code: text('code').notNull(),

// Add in table definition:
(t) => [
  // ... indexes
  check('locations_code_format_chk', 
    sql`code ~ '^[A-Z0-9-]+$'`  // Alphanumeric + dash, uppercase
  ),
]
```

#### Option B: Application-Level Validation (Simpler)
```typescript
// location.contract.ts
export const LocationCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with dashes')
  .min(3)
  .max(20)

export const LocationCreateDto = z.object({
  code: LocationCodeSchema,
  // ...
})
```

**Recommendation:** **Option B** (app-level) for flexibility

---

### **MINOR: Missing Indexes for Queries** 🟡

**Common Queries:**
```sql
-- Filter by type
SELECT * FROM locations WHERE type = 'warehouse';

-- Filter by active status
SELECT * FROM locations WHERE is_active = TRUE;

-- Combined filter (very common in UI)
SELECT * FROM locations WHERE type = 'store' AND is_active = TRUE;
```

**Current Indexes:**
- ✅ `locations_code_active_idx` (unique on code)
- ✅ `locations_name_active_idx` (unique on name)
- ❌ No index on `type`
- ❌ No index on `is_active`

**Recommendation:** Add composite index
```typescript
(t) => [
  uniqueIndex('locations_code_active_idx').on(t.code),
  uniqueIndex('locations_name_active_idx').on(t.name),
  index('locations_type_active_idx').on(t.type, t.isActive),  // ✅ Add this
]
```

**Benefit:**
- ✅ Faster filtered lists (warehouse filter, active filter)
- ✅ Small overhead (only 2 columns, low cardinality)

---

## 📝 Summary

| Category | Rating | Notes |
|----------|--------|-------|
| **Documentation** | ⭐⭐⭐⭐⭐ | Excellent, clear business rules |
| **Type Safety** | ⭐⭐⭐⭐⭐ | Enum + Zod validation |
| **Audit Trail** | ⭐⭐⭐⭐⭐ | Full audit columns |
| **Soft Delete** | ⭐⭐⭐⭐⭐ | isActive pattern |
| **Indexing** | ⭐⭐⭐ | Missing partial unique, query index |
| **Constraints** | ⭐⭐⭐⭐ | Good, could add code format |
| **Overall** | ⭐⭐⭐⭐ | Solid foundation, minor issues |

---

## 🎯 Recommended Actions

### **Priority 1: Fix Partial Unique Indexes** 🔴

**Action:** Replace Drizzle indexes with manual migration

**Files to Change:**
1. `location.ts` - Remove index definitions, add comment
2. New migration - Create partial unique indexes via SQL

**Effort:** 30 minutes  
**Impact:** ⭐⭐⭐⭐⭐ (Fixes business constraint issue)

---

### **Priority 2: Add Query Index** 🟡

**Action:** Add composite index for type + isActive filtering

```typescript
index('locations_type_active_idx').on(t.type, t.isActive),
```

**Effort:** 5 minutes  
**Impact:** ⭐⭐⭐ (Performance improvement for common queries)

---

### **Priority 3: Add Code Format Validation** 🟡

**Action:** Add regex validation in contract

```typescript
code: z.string().trim().regex(/^[A-Z0-9-]+$/).min(3).max(20)
```

**Effort:** 5 minutes  
**Impact:** ⭐⭐ (Data quality improvement)

---

## 💡 Schema Best Practices Applied

✅ **Serial PK** - Efficient, human-readable  
✅ **Audit columns** - Full trail for compliance  
✅ **Soft delete** - Safe deactivation  
✅ **Type enum** - Database-level constraint  
✅ **Unique constraints** - Prevent duplicates  
✅ **Documentation** - Clear business rules  
⚠️ **Partial indexes** - Needs manual migration (Drizzle limitation)

---

**Status:** ✅ Schema is production-ready with minor improvements recommended  
**Next:** Apply fixes and generate migration
