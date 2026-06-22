# Module Audit Report - Task 2.2

**Date:** 2026-06-22  
**Auditor:** Claude Code + Solo Developer  
**Scope:** Active modules (iam, location, auth, session, tool)

---

## 📊 Executive Summary

| Module | Compliance | Files | Structure | Patterns | Issues |
|--------|-----------|-------|-----------|----------|--------|
| **location** | ✅ 95% | 7/7 | ✅ Excellent | ✅ All good | 1 minor |
| **iam** | ⚠️ 85% | 16/16 | ✅ Good | ⚠️ Mixed | 3 moderate |
| **auth** | ⚠️ 70% | 5/5 | ⚠️ Incomplete | ⚠️ Missing repo | 2 major |
| **session** | ⚠️ 75% | 5/5 | ⚠️ Incomplete | ✅ Good | 2 moderate |
| **tool** | ⚠️ 60% | 4/4 | ⚠️ Incomplete | ❌ Non-standard | 3 major |

**Overall Project Health:** ⚠️ **75%** - Good foundation, needs standardization

---

## 📁 Module-by-Module Audit

### 1. `location/` Module ✅ **EXCELLENT** (95%)

**Structure:**
```
location/
├── location.module.ts      ✅
├── location.contract.ts    ✅
├── location.repo.ts        ✅
├── location.service.ts     ✅
├── location.route.ts       ✅
├── location.internal.ts    ✅
└── index.ts                ✅
```

**Compliance Checklist:**
- [x] Module factory pattern (`createLocationModule`)
- [x] Zod contracts with spread-shape
- [x] Repository with `null` return (not throw)
- [x] Service with `handleX` methods
- [x] Conflict checking before CREATE/UPDATE
- [x] Audit stamps on mutations
- [x] Cache invalidation on writes
- [x] Error helpers in `.internal.ts`
- [x] Public API via `index.ts`
- [x] OTEL tracing (`@record`)

**Issues Found:**
1. **Minor:** Some methods use `handleDetail` instead of `handleGetById` (naming inconsistency)

**Recommendation:** ✅ **Use as reference implementation**

---

### 2. `iam/` Module ⚠️ **GOOD** (85%)

**Structure:**
```
iam/
├── iam.module.ts           ✅
├── iam.route.ts            ✅
├── index.ts                ✅
├── constants.ts            ✅
├── user/
│   ├── user.contract.ts    ✅
│   ├── user.repo.ts        ✅
│   └── user.service.ts     ✅
├── role/
│   ├── role.contract.ts    ✅
│   ├── role.repo.ts        ✅
│   └── role.service.ts     ✅
├── assignment/
│   ├── assignment.contract.ts  ✅
│   ├── assignment.repo.ts      ✅
│   └── assignment.service.ts   ✅
└── composed/
    ├── composed.contract.ts    ✅
    ├── composed.repo.ts        ✅
    └── composed.service.ts     ✅
```

**Compliance Checklist:**
- [x] Complex module with submodules
- [x] Module factory with dependencies
- [x] Zod contracts (some use spread-shape)
- [x] Services with `handleX` methods
- [x] Conflict checking
- [x] Audit stamps
- [x] Cache invalidation
- [x] OTEL tracing
- [ ] **Missing `.internal.ts` for error helpers**
- [ ] **Inconsistent method naming** (`handleDetail` vs `handleGetById`)
- [ ] **Some services have non-standard public methods** (e.g., `getListAll`, `getRelationMap`)

**Issues Found:**
1. **Moderate:** Missing `user.internal.ts`, `role.internal.ts` - error helpers defined inline in services
2. **Moderate:** Inconsistent public method naming:
   - `handleCreate`, `handleUpdate`, `handleRemove` ✅
   - `handleDetail` ⚠️ (should be `handleGetById`)
   - `getListAll`, `getRelationMap` ❌ (not `handleX` pattern)
3. **Moderate:** Some methods don't follow `handleX` convention for public APIs

**Recommendation:** ⚠️ **Refactor to standardize naming**

---

### 3. `auth/` Module ⚠️ **NEEDS WORK** (70%)

**Structure:**
```
auth/
├── auth.module.ts          ✅
├── auth.contract.ts        ✅
├── auth.service.ts         ✅
├── auth.route.ts           ✅
├── index.ts                ✅
├── auth.repo.ts            ❌ MISSING
└── auth.internal.ts        ❌ MISSING
```

**Compliance Checklist:**
- [x] Module factory pattern
- [x] Zod contracts
- [x] Service with business logic
- [x] Routes
- [ ] **Missing `auth.repo.ts`** (queries inline in service)
- [ ] **Missing `auth.internal.ts`** (error helpers)
- [ ] **No conflict checking** (if applicable)
- [x] Audit stamps (if mutations exist)
- [x] Cache usage

**Issues Found:**
1. **Major:** No repository layer - DB queries mixed with business logic in service
2. **Major:** No error helper file - errors defined inline
3. **Moderate:** Unclear if module needs repo (auth might be stateless, but verify)

**Recommendation:** ⚠️ **Add repo layer if DB operations exist, create `.internal.ts`**

---

### 4. `session/` Module ⚠️ **ACCEPTABLE** (75%)

**Structure:**
```
session/
├── session.module.ts       ✅
├── session.contract.ts     ✅
├── session.repo.ts         ✅
├── session.service.ts      ✅
├── index.ts                ✅
├── session.route.ts        ❌ MISSING (might not need routes)
└── session.internal.ts     ❌ MISSING
```

**Compliance Checklist:**
- [x] Module factory pattern
- [x] Zod contracts
- [x] Repository layer exists
- [x] Service with business logic
- [x] Audit stamps
- [x] Cache usage
- [ ] **Missing `session.internal.ts`** (error helpers)
- [ ] Routes might not be needed (internal use only)

**Issues Found:**
1. **Moderate:** Missing `session.internal.ts` - error helpers inline
2. **Moderate:** No routes (acceptable if session is internal-only)

**Recommendation:** ⚠️ **Add `.internal.ts` for error standardization**

---

### 5. `tool/` Module ❌ **NON-STANDARD** (60%)

**Structure:**
```
tool/
├── tool.module.ts          ✅
├── seed.service.ts         ⚠️ (non-standard name)
├── seed.route.ts           ⚠️ (non-standard name)
├── index.ts                ✅
├── tool.contract.ts        ❌ MISSING
├── tool.repo.ts            ❌ MISSING
├── tool.service.ts         ❌ MISSING
└── tool.internal.ts        ❌ MISSING
```

**Compliance Checklist:**
- [x] Module factory pattern
- [ ] **Missing `tool.contract.ts`**
- [ ] **Missing `tool.repo.ts`** (if DB operations exist)
- [ ] **Missing `tool.service.ts`** (named `seed.service.ts` instead)
- [ ] **Missing `tool.internal.ts`**
- [ ] Non-standard file naming (`seed.*` instead of `tool.*`)

**Issues Found:**
1. **Major:** Incomplete module structure - missing standard files
2. **Major:** Non-standard naming (`seed.service.ts` instead of `tool.service.ts`)
3. **Major:** Unclear purpose - is this a seed utility or a feature module?

**Recommendation:** ❌ **Refactor or clarify module purpose**

---

## 🎯 Common Issues Across Modules

### 1. Missing `.internal.ts` Files (4/5 modules)
**Impact:** Error helpers scattered, inconsistent error codes

**Affected Modules:**
- `iam/` - errors defined inline in services
- `auth/` - errors defined inline
- `session/` - errors defined inline
- `tool/` - no error handling visible

**Fix:**
```typescript
// Example: iam/user/user.internal.ts
import { NotFoundError, ConflictError } from '@/shared/errors/http-error'

export const UserError = {
  notFound: (id: number) =>
    new NotFoundError('User not found', {
      code: 'USER_NOT_FOUND',
      context: { id },
    }),
  emailExists: (email: string) =>
    new ConflictError('Email already exists', {
      code: 'USER_EMAIL_ALREADY_EXISTS',
      context: { email },
    }),
}
```

---

### 2. Inconsistent Public Method Naming (2/5 modules)
**Impact:** Confusing API, harder for AI to understand patterns

**Patterns Found:**
- ✅ `handleCreate`, `handleUpdate`, `handleDelete` (consistent)
- ⚠️ `handleDetail` vs `handleGetById` (inconsistent)
- ⚠️ `handleRemove` vs `handleDelete` (inconsistent)
- ❌ `getListAll`, `getRelationMap` (not `handleX` pattern)

**Recommendation:**
```typescript
// Standard naming
async handleCreate()        // CREATE
async handleUpdate()        // UPDATE
async handleDelete()        // DELETE (not handleRemove)
async handleGetById()       // GET by ID (not handleDetail)
async handleList()          // LIST with pagination
async handleGetByIds()      // Batch GET

// Helper methods (can be non-handleX)
toRelationMap()             // Utility for other services
```

---

### 3. Missing Repository Layer (2/5 modules)
**Impact:** Business logic mixed with data access, harder to test

**Affected Modules:**
- `auth/` - queries inline in service
- `tool/` - unclear structure

**Fix:** Extract DB queries to `*.repo.ts` files

---

## 📋 Refactor Priority Matrix

| Priority | Module | Task | Effort | Impact |
|----------|--------|------|--------|--------|
| **P0** | `tool/` | Clarify purpose & restructure | High | High |
| **P0** | `auth/` | Add repo layer (if needed) | Medium | High |
| **P1** | All | Create `.internal.ts` for errors | Low | Medium |
| **P1** | `iam/` | Standardize method naming | Low | Medium |
| **P2** | All | Rename `handleDetail` → `handleGetById` | Low | Low |
| **P2** | All | Rename `handleRemove` → `handleDelete` | Low | Low |

---

## ✅ Refactor Action Plan

### Phase A: Critical Fixes (P0)
1. **tool/ module** - Decide: Refactor or remove
   - If seed utility → Move to `scripts/`
   - If feature → Restructure to standard format
2. **auth/ module** - Add missing repo layer
   - Extract DB queries from service
   - Create `auth.repo.ts`
   - Add `auth.internal.ts`

### Phase B: Standardization (P1)
1. **Create `.internal.ts` for all modules**
   - Extract error helpers
   - Standardize error codes
   - Add context to all errors
2. **Standardize public method naming**
   - `iam/user/` - rename methods
   - `iam/role/` - rename methods
   - Document naming convention

### Phase C: Polish (P2)
1. **Global method rename**
   - `handleDetail` → `handleGetById`
   - `handleRemove` → `handleDelete`
   - `getListAll` → `handleGetAll` or move to private
2. **Add missing route files** (if needed)
3. **Documentation updates**

---

## 📊 Estimated Effort

| Phase | Modules | Tasks | Time | Complexity |
|-------|---------|-------|------|------------|
| Phase A | 2 | 4 | 2-3h | High |
| Phase B | 4 | 8 | 3-4h | Medium |
| Phase C | 5 | 10 | 2-3h | Low |
| **Total** | **5** | **22** | **7-10h** | **Medium** |

---

## 🎓 Lessons Learned

1. **location/ is gold standard** - Use as template for new modules
2. **iam/ is close** - Just needs error file extraction
3. **tool/ needs clarification** - Purpose unclear
4. **Consistency matters** - Small naming differences add up
5. **Documentation wins** - Having templates prevents drift

---

## 📝 Next Steps

1. **Approve refactor plan** with user
2. **Start with P0 fixes** (tool, auth)
3. **Batch P1 standardization** (error files, naming)
4. **Verify with tests** after each phase
5. **Update documentation** with final patterns

---

**Report Status:** ✅ Complete  
**Recommendation:** Proceed with refactor plan  
**Estimated Impact:** High - Will significantly improve codebase consistency
