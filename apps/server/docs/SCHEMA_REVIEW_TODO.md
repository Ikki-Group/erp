# Schema Review - TODO

**Date:** 2026-06-23  
**Status:** 🔄 IN PROGRESS

---

## ✅ Completed Reviews (All Applied & Committed)

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

5. ✅ **material.ts** (Commit: f4571464)
   - Fixed: Use type-safe eq() for partial indexes
   - Both materials_sku_active_idx and materials_name_type_active_idx

6. ✅ **product.ts** (Commit: f4571464)
   - Fixed: Use type-safe eq() for partial index (product_variants_default_idx)
   - Added: Check constraints for all price fields (3 constraints)

7. ✅ **inventory.ts** (Commit: f4571464)
   - Fixed: Added explicit column names to ALL fields (consistency)
   - Fixed: Use type-safe isNull() for partial index
   - Changed: Quantity precision from scale 4 → scale 6 (match material.ts)
   - Added: Check constraints for cost fields (3 constraints)

8. ✅ **sales.ts** (Commit: 06bd3b3b)
   - Fixed: Added explicit column names to ALL fields (8 tables, ~50 fields)
   - Changed: Quantity precision from scale 4 → scale 6 (match inventory.ts)
   - Added: Check constraints for all amount/quantity fields (14 constraints)
   - Added: batchStatusEnum (replaced text status)

9. ✅ **sales-type.ts** (Commit: pending)
   - Fixed: isBuiltIn → isSystem (naming consistency)
   - Fixed: Use type-safe isNull()/isNotNull() for partial indexes (4 indexes)
   - Updated: Check constraint name (system_global_chk)

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
   - [x] material.ts ✅ (f4571464)
   - [x] product.ts ✅ (f4571464)
   - [x] inventory.ts ✅ (f4571464)
   - [x] sales.ts ✅ (06bd3b3b)
   - [ ] inventory_transfer.ts
   - [ ] purchasing.ts
   - [ ] production.ts
   - [ ] recipe.ts
   - [ ] customer.ts
   - [ ] supplier.ts
   - [ ] employee.ts
   - [ ] finance.ts
   - [ ] finance_payment.ts
   - [ ] hr.ts
   - [ ] tax.ts
   - [ ] sales-type.ts
   - [ ] payment_methods.ts
   - [ ] payment_provider.ts
   - [ ] location_payment_method.ts
   - [ ] company.ts
   - [ ] moka.ts
   - [ ] audit.ts
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
| location.ts | ✅ Committed (5c7b4b95) | Partial index design | ⭐⭐⭐⭐⭐ |
| iam.ts | ✅ Committed (3c8fef2e) | Field name mismatch | ⭐⭐⭐⭐⭐ |
| session.ts | ✅ Committed (5dce9701) | Missing locationId | ⭐⭐⭐⭐⭐ |
| uom.ts | ✅ Committed (228a1c22) | Field name mismatch | ⭐⭐⭐⭐⭐ |
| material.ts | ✅ Committed (f4571464) | Non-type-safe partial indexes | ⭐⭐⭐⭐⭐ |
| product.ts | ✅ Committed (f4571464) | Non-type-safe partial index + check constraints | ⭐⭐⭐⭐⭐ |
| inventory.ts | ✅ Committed (f4571464) | Missing column names + precision + check constraints | ⭐⭐⭐⭐⭐ |
| sales.ts | ✅ Committed (06bd3b3b) | Missing column names + precision + check constraints + enum | ⭐⭐⭐⭐⭐ |

---

**Status:** 8/30+ schemas reviewed  
**Next:** Continue reviewing remaining schemas, then update relations
