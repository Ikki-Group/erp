# Schema Review - TODO

**Date:** 2026-06-23  
**Status:** 🔄 IN PROGRESS

---

## ✅ Completed Reviews (All Applied & Committed)

1. ✅ **location.ts** (Commit: 5c7b4b95)
2. ✅ **iam.ts** (Commit: 3c8fef2e)
3. ✅ **session.ts** (Commit: 5dce9701)
4. ✅ **uom.ts** (Commit: 228a1c22)
5. ✅ **material.ts** (Commit: f4571464)
6. ✅ **product.ts** (Commit: f4571464)
7. ✅ **inventory.ts** (Commit: f4571464)
8. ✅ **sales.ts** (Commit: 06bd3b3b)
9. ✅ **sales-type.ts** (Commit: b13d127b)
10. ✅ **purchasing.ts** (Commit: 9c5d5d04)
11. ✅ **production.ts** (Commit: 73a459dd)
12. ✅ **recipe.ts** (Commit: d204d6e8)
13. ✅ **inventory_transfer.ts** (Commit: c5ff950b)
14. ✅ **employee.ts** (Commit: 636e5d69)
15. ✅ **customer.ts** (Commit: 4a8a3a07)
16. ✅ **hr.ts** (Commit: 593224d3)
17. ✅ **supplier.ts** (Commit: 7a26ef29)
18. ✅ **finance.ts** (Commit: d4bd881a)
19. ✅ **finance_payment.ts** (Commit: 3568b7a1)
20. ✅ **tax.ts** (Commit: 167cd0ca)
21. ✅ **company.ts** (Commit: 63dd0267, 4e4dfc26 - fixed unused param)
22. ✅ **payment_methods.ts** (Commit: a3354a53)
23. ✅ **payment_provider.ts** (Commit: 1b801f7 - already excellent)
24. ✅ **location_payment_method.ts** (Commit: bc576496)
25. ✅ **moka.ts** (Commit: 2c221882)
26. ✅ **audit.ts** (Commit: 82d43a5d)
27. ✅ **\_enums.ts** (Commit: 4e4dfc26 - CREATED, then 520a9ef7 - MOVED to domain files)
28. ✅ **\_helpers.ts** (Already excellent - no changes needed)
29. ✅ **\_relations.ts** (Commit: e36b35a6 - Updated with implementation guide)

---

## 📋 Pending Tasks

### **IMPORTANT: Update \_relations.ts After All Reviews**

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

1. **Schema Reviews: COMPLETE** ✅
   - [x] All 26 domain schemas ✅
   - [x] 25 enums moved to domain files ✅
   - [x] \_helpers.ts (already excellent) ✅
   - [x] \_relations.ts (implementation guide added) ✅

**All schema files reviewed!** 🎉

### Key Achievements:

- ✅ Explicit column names on ALL fields
- ✅ Type-safe partial indexes (eq, isNull, isNotNull)
- ✅ Enums colocated with tables (removed centralized \_enums.ts)
- ✅ Quantity scale 6, cost scale 2 (consistency)
- ✅ Check constraints for data integrity
- ✅ Performance indexes
- ✅ Relations guide for future implementation

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

**Progress:** 29/29 schemas reviewed (100%) ✅

**Batch 1-9:** Initial improvements (location → sales-type)  
**Batch 10-17:** Production & HR cycle (purchasing → supplier)  
**Batch 18-26:** Finance & integrations (finance → audit)  
**Batch 27-29:** Helper files (\_enums → domain files, \_helpers, \_relations)

### Common Improvements Applied:

- ✅ Explicit column names on ALL fields
- ✅ Type-safe partial indexes (eq, isNull, isNotNull)
- ✅ Quantity precision scale 6 (consistency)
- ✅ Cost/monetary precision scale 2
- ✅ Check constraints for data integrity
- ✅ Performance indexes
- ✅ Timestamp mode and timezone explicit

### Key Schemas:

| Schema        | Key Changes                         | Commit   |
| ------------- | ----------------------------------- | -------- |
| inventory.ts  | Quantity scale 6, type-safe indexes | f4571464 |
| sales.ts      | 8 tables, 14 check constraints      | 06bd3b3b |
| purchasing.ts | 8 tables, 17 check constraints      | 9c5d5d04 |
| finance.ts    | Debit/credit validation             | d4bd881a |
| audit.ts      | 4 performance indexes               | 82d43a5d |

### Schema Files Summary:

| Category          | Count     | Status                                     |
| ----------------- | --------- | ------------------------------------------ |
| Domain Schemas    | 26        | ✅ Complete                                |
| Helper Files      | 3         | ✅ Complete (\_helpers, \_relations guide) |
| Enum Distribution | 25 enums  | ✅ Moved to domain files                   |
| **Total**         | **29/29** | **✅ 100% Complete**                       |

---

**Status:** 29/29 schemas reviewed (100%) 🎉  
**Enums:** Distributed to 10 domain files (finance, purchasing, sales, etc.)  
**Relations:** Implementation guide added (to be populated after exports)

**Next Steps:**

1. Run `bun run db:generate` to create migration
2. Review generated SQL migration
3. Test migration on dev database
4. Enable table exports in index.ts (when ready)
5. Implement relations in \_relations.ts (optional, for query convenience)
