# Schema Review - TODO

**Date:** 2026-06-23  
**Status:** 🔄 IN PROGRESS

---

## ✅ Completed Reviews

1. ✅ **location.ts** (Commit: 5c7b4b95)
   - Fixed indexes (removed partial where)
   - Global unique constraints
   - Query optimization index

2. ✅ **iam.ts** (Commit: 3c8fef2e)
   - Fixed: is_built_in → is_system
   - Added: users_active_idx
   - Enhanced documentation

3. ✅ **session.ts** (Commit: 5dce9701)
   - Added: locationId (CRITICAL for LBAC)
   - Changed: text → varchar(512) for userAgent
   - Added: sessions_location_idx

4. ✅ **uom.ts** (Commit: 228a1c22)
   - Fixed: is_built_in → is_system
   - Updated documentation

5. ✅ **material.ts** (Commit: pending)
   - Fixed: Use type-safe eq() for partial indexes
   - Both materials_sku_active_idx and materials_name_type_active_idx

6. ✅ **product.ts** (Commit: pending)
   - Fixed: Use type-safe eq() for partial index (product_variants_default_idx)
   - Added: Check constraints for all price fields (3 constraints)

7. ✅ **inventory.ts** (Commit: pending)
   - Fixed: Added explicit column names to ALL fields (consistency)
   - Fixed: Use type-safe isNull() for partial index
   - Changed: Quantity precision from scale 4 → scale 6 (match material.ts)
   - Added: Check constraints for cost fields (3 constraints)

8. ✅ **sales.ts** (Commit: pending)
   - Fixed: Added explicit column names to ALL fields (8 tables, ~50 fields)
   - Changed: Quantity precision from scale 4 → scale 6 (match inventory.ts)
   - Added: Check constraints for all amount/quantity fields (14 constraints)
   - Added: batchStatusEnum (replaced text status)

---

## 📋 Pending Tasks

### **IMPORTANT: Update _relations.ts After All Reviews**

**File:** `apps/server/src/db/schema/_relations.ts`

**Current State:**
```typescript
export const relations = defineRelations(schema, () => ({}))
// Empty! No relations defined
```

**Why Update After Reviews:**
- All schema changes finalized first
- Define relationships in one pass
- Avoid multiple migration conflicts

**Relations to Define:**

#### From location.ts:
```typescript
locationsTable: {
  users: r.many.usersTable(),           // defaultLocationId FK
  assignments: r.many.userAssignmentsTable(),
  sessions: r.many.sessionsTable(),      // ✅ NEW (locationId added)
}
```

#### From iam.ts:
```typescript
usersTable: {
  defaultLocation: r.one.locationsTable(),
  assignments: r.many.userAssignmentsTable(),
  sessions: r.many.sessionsTable(),
  addedAssignments: r.many.userAssignmentsTable(), // as addedBy
}

rolesTable: {
  assignments: r.many.userAssignmentsTable(),
}

userAssignmentsTable: {
  user: r.one.usersTable(),
  role: r.one.rolesTable(),
  location: r.one.locationsTable(),
  addedBy: r.one.usersTable(),
}
```

#### From session.ts:
```typescript
sessionsTable: {
  user: r.one.usersTable(),
  location: r.one.locationsTable(),      // ✅ NEW (locationId added)
}
```

---

## 🎯 Next Steps

1. **Continue Schema Reviews:**
   - [ ] material.ts
   - [ ] product.ts
   - [ ] inventory.ts
   - [ ] sales.ts
   - [ ] purchasing.ts
   - [ ] finance.ts
   - [ ] hr.ts
   - [ ] Other schemas...

2. **After ALL Reviews Complete:**
   - [ ] Update `_relations.ts` with all relationships
   - [ ] Run `bun run db:generate` to generate migration
   - [ ] Review generated migration SQL
   - [ ] Test migration on dev database
   - [ ] Update seed scripts if needed

3. **Update Contracts (if needed):**
   - [ ] session.contract.ts (add locationId)
   - [ ] Verify all DTOs match schema changes

---

## 📊 Schema Review Summary

| Schema | Status | Issues Found | Rating |
|--------|--------|--------------|--------|
| location.ts | ✅ Applied & Committed | Partial index design | ⭐⭐⭐⭐⭐ |
| iam.ts | ✅ Applied & Committed | Field name mismatch | ⭐⭐⭐⭐⭐ |
| session.ts | ✅ Applied & Committed | Missing locationId | ⭐⭐⭐⭐⭐ |
| uom.ts | ✅ Applied & Committed | Field name mismatch | ⭐⭐⭐⭐⭐ |
| material.ts | ✅ Applied (pending commit) | Non-type-safe partial indexes | ⭐⭐⭐⭐⭐ |
| product.ts | ✅ Applied (pending commit) | Non-type-safe partial index + check constraints | ⭐⭐⭐⭐⭐ |
| inventory.ts | ✅ Applied (pending commit) | Missing column names + precision + check constraints | ⭐⭐⭐⭐⭐ |
| sales.ts | ✅ Applied (pending commit) | Missing column names + precision + check constraints + enum | ⭐⭐⭐⭐⭐ |

---

**Status:** 8/30+ schemas reviewed  
**Next:** Continue reviewing remaining schemas, then update relations
