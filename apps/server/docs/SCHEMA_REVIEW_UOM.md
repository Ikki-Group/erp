# Schema Review: uom.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

```typescript
export const uomsTable = pgTable(
	'uoms',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		isBuiltIn: boolean('is_built_in').notNull().default(false),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('uoms_code_idx').on(t.code),
		uniqueIndex('uoms_name_idx').on(t.name),

		// Prevent 'kg' vs 'KG' duplicate drift — code must always be uppercase
		check('uoms_code_uppercase_chk', sql`code = upper(code)`),
	],
)
```

---

## ✅ Strengths

### 1. **Excellent Documentation** ⭐⭐⭐⭐⭐

```typescript
/**
 * Units of Measure Table
 *
 * Global reference table — UOMs are shared across all locations and modules
 * (materials, products, inventory transactions). Not scoped per location.
 *
 * `code`      — normalized, uppercase machine identifier (e.g. 'KG', 'PCS', 'LTR').
 *               Used as the stable reference in application logic, seeding,
 *               and cross-module foreign keys. Never changes after creation.
 *               Enforced uppercase via check constraint to prevent
 *               'kg' vs 'KG' duplicate drift.
 *
 * `name`      — human-readable display label (e.g. 'Kilogram', 'Pieces').
 *               Unique to prevent display ambiguity in UOM pickers.
 *
 * `isBuiltIn` — true for UOMs created by the system seeder (e.g. KG, PCS, LTR).
 *               Built-in UOMs are protected from update and deletion by the
 *               service layer. Mirrors the pattern on rolesTable.
 *
 * Deletion protection:
 *   UOMs are referenced by materialsTable (baseUomId) and
 *   materialConversionsTable (uomId) with onDelete: 'restrict'.
 *   A UOM in active use cannot be deleted regardless of isBuiltIn.
 *   isBuiltIn adds a second layer of protection for seeded UOMs
 *   even before any material references them.
 */
```

**✅ Outstanding:** Clear scope, constraints explained, deletion strategy documented

---

### 2. **Check Constraint for Uppercase** ⭐⭐⭐⭐⭐

```typescript
check('uoms_code_uppercase_chk', sql`code = upper(code)`)
```

**✅ Excellent pattern:**

- Prevents case drift ('kg' vs 'KG')
- Database-level enforcement (not just app-level)
- Matches documentation perfectly

---

### 3. **Global Reference Design** ⭐⭐⭐⭐⭐

**Documentation:**

> "Global reference table — UOMs are shared across all locations"

**✅ Perfect for UOM:**

- KG is KG everywhere (not location-specific)
- Simplifies inventory, recipes, conversions
- Avoids duplication across locations

---

### 4. **Unique Constraints** ⭐⭐⭐⭐⭐

```typescript
uniqueIndex('uoms_code_idx').on(t.code),
uniqueIndex('uoms_name_idx').on(t.name),
```

**✅ Good:**

- Code unique (machine identifier)
- Name unique (prevents UI ambiguity)

---

### 5. **Deletion Strategy** ⭐⭐⭐⭐⭐

**Two-Layer Protection:**

1. **FK Restrict:** Materials/conversions reference UOMs with `onDelete: 'restrict'`
2. **isBuiltIn Flag:** Service layer prevents deletion of seeded UOMs

**✅ Excellent defense-in-depth**

---

## ⚠️ Issues & Improvements

### **CRITICAL: Field Name Mismatch** 🔴

**Same Issue as IAM Schema:**

```typescript
// Schema uses:
isBuiltIn: boolean('is_built_in') // ❌ Column: is_built_in

// Documentation uses:
isBuiltIn // Field name: isBuiltIn

// Should be:
isSystem: boolean('is_system') // ✅ Consistent with roles/users
```

**Why `isSystem` is Better:**

- Matches IAM naming (`roles.isSystem`, `users.isSystem`)
- More accurate: "system-seeded" not "built-in"
- Consistent across codebase

---

**Solution:**

```typescript
isSystem: boolean('is_system').notNull().default(false)
```

**Update Documentation:**

```typescript
/**
 * `isSystem` — true for UOMs created by the system seeder (e.g. KG, PCS, LTR).
 *              System UOMs are protected from update and deletion by the
 *              service layer. Mirrors the pattern on rolesTable and usersTable.
 */
```

---

### **MINOR: Check Constraint Could Be More Efficient** 🟡

**Current:**

```typescript
check('uoms_code_uppercase_chk', sql`code = upper(code)`)
```

**Works correctly**, but creates overhead on every INSERT/UPDATE

**Alternative Pattern:**

#### Option A: Application-Level (Recommended)

```typescript
// In contract:
code: z.string().trim().toUpperCase()

// No DB check constraint needed
```

**Pros:**

- ✅ Faster (no DB check on every write)
- ✅ Clear validation message
- ✅ Zod already transforms to uppercase

**Cons:**

- ⚠️ No DB-level enforcement (relies on app)

---

#### Option B: Keep DB Constraint (Current)

**Pros:**

- ✅ Defense-in-depth
- ✅ Protects against direct SQL inserts
- ✅ Explicit in schema

**Cons:**

- ⚠️ Slight overhead on writes

---

**Recommendation:** **Keep DB constraint** for defense-in-depth

- UOMs are low-churn (write once, read many)
- Overhead negligible
- Extra safety layer worth it

---

### **DESIGN: Audit Columns on Reference Table** 🟢

**Current:**

```typescript
...auditBasicColumns,  // createdBy, updatedBy, createdAt, updatedAt
```

**Question:** Do we need full audit on UOMs?

**Considerations:**

| Need           | Reason                                           |
| -------------- | ------------------------------------------------ |
| ✅ `createdAt` | When was UOM added (useful for system changes)   |
| ✅ `createdBy` | Who added custom UOM (accountability)            |
| ❓ `updatedAt` | UOMs rarely updated (code/name should be stable) |
| ❓ `updatedBy` | Updates discouraged (rename = new UOM better)    |

**Current Design:** **Keep audit columns**

- ✅ Small overhead (reference table, low volume)
- ✅ Useful for custom UOMs (who added "SACK"?)
- ✅ Consistent with other tables

**Alternative:** Could use simplified audit

```typescript
createdAt: timestamp('created_at').notNull().defaultNow(),
createdBy: integer('created_by').notNull(),
// No updatedAt/updatedBy (UOMs shouldn't change)
```

**Recommendation:** **Keep current** (full audit is fine)

---

## 📝 Summary

| Category                | Rating     | Notes                         |
| ----------------------- | ---------- | ----------------------------- |
| **Documentation**       | ⭐⭐⭐⭐⭐ | Outstanding clarity           |
| **Check Constraint**    | ⭐⭐⭐⭐⭐ | Perfect uppercase enforcement |
| **Global Design**       | ⭐⭐⭐⭐⭐ | Correct for UOM               |
| **Unique Constraints**  | ⭐⭐⭐⭐⭐ | Code + name unique            |
| **Deletion Protection** | ⭐⭐⭐⭐⭐ | Two-layer defense             |
| **Naming**              | ⭐⭐⭐     | **isBuiltIn → isSystem**      |
| **Overall**             | ⭐⭐⭐⭐⭐ | Excellent (after naming fix)  |

---

## 🎯 Recommended Actions

### **Priority 1: Fix Field Name** 🔴

**Action:** Rename `isBuiltIn` to `isSystem`

```typescript
isSystem: boolean('is_system').notNull().default(false)
```

**Update Documentation:**

- Change all `isBuiltIn` references to `isSystem`
- Update comments to match IAM pattern

**Effort:** 2 minutes  
**Impact:** ⭐⭐⭐⭐⭐ (Consistency across codebase)

---

### **Priority 2: No Other Changes Needed** ✅

**Schema is excellent as-is:**

- ✅ Check constraint working perfectly
- ✅ Global reference design correct
- ✅ Audit columns appropriate
- ✅ Documentation outstanding

---

## 💡 Schema Best Practices Applied

✅ **Global Reference** - UOMs shared, not scoped  
✅ **Check Constraint** - Uppercase enforcement at DB level  
✅ **Unique Constraints** - Code + name  
✅ **Deletion Protection** - Two-layer (FK + flag)  
✅ **Documentation** - Comprehensive and clear  
⚠️ **Naming** - isBuiltIn → isSystem for consistency

---

## 🔗 Cross-Schema Consistency

**Field Name Pattern:**

| Table | Current                     | Should Be      | Status           |
| ----- | --------------------------- | -------------- | ---------------- |
| roles | `is_built_in` → `is_system` | ✅ FIXED       | Commit: 3c8fef2e |
| users | `is_built_in` → `is_system` | ✅ FIXED       | Commit: 3c8fef2e |
| uoms  | `is_built_in`               | ❌ `is_system` | **THIS SCHEMA**  |

**After Fix:** All tables use consistent `is_system` naming ✅

---

## 📊 Example UOMs

**System UOMs (isSystem = true):**

```sql
INSERT INTO uoms (code, name, is_system) VALUES
  ('KG', 'Kilogram', true),
  ('G', 'Gram', true),
  ('PCS', 'Pieces', true),
  ('LTR', 'Liter', true),
  ('ML', 'Milliliter', true);
```

**Custom UOMs (isSystem = false):**

```sql
INSERT INTO uoms (code, name, is_system, created_by) VALUES
  ('SACK', 'Sack (25kg)', false, 1),      -- Business-specific
  ('CARTON', 'Carton (12 pcs)', false, 1); -- Custom unit
```

---

## 🎯 Usage Pattern

**In Materials:**

```typescript
// Material has base UOM
material: {
  code: 'SUGAR',
  name: 'White Sugar',
  baseUomId: 1,  // → KG
}

// Conversions to other UOMs
conversions: [
  { materialId: 1, fromUomId: 1, toUomId: 2, factor: 1000 }, // KG → G
  { materialId: 1, fromUomId: 1, toUomId: 6, factor: 0.04 },  // KG → SACK (25kg)
]
```

**In Inventory:**

```typescript
// Transaction in any UOM
transaction: {
  materialId: 1,
  quantity: 2.5,
  uomId: 6,  // SACK
}
```

**Check Constraint in Action:**

```sql
-- ✅ Allowed
INSERT INTO uoms (code, name) VALUES ('KG', 'Kilogram');
INSERT INTO uoms (code, name) VALUES ('PCS', 'Pieces');

-- ❌ Rejected by check constraint
INSERT INTO uoms (code, name) VALUES ('kg', 'Kilogram');
-- ERROR: check constraint "uoms_code_uppercase_chk" violated

-- ✅ Auto-uppercase in application layer prevents this
```

---

**Status:** ✅ Schema is excellent, one naming fix needed  
**Next:** Apply isSystem rename for consistency
