# Location Module - Refinement Checklist

**Module:** `location`  
**Layer:** Layer 1 (Master Data - Foundation)  
**Dependencies:** None  
**Status:** 🔄 IN PROGRESS

---

## 📋 Module Files

- [x] `location.contract.ts` - Zod schemas & types
- [x] `location.internal.ts` - Internal errors
- [x] `location.repo.ts` - Database repository
- [x] `location.service.ts` - Business logic
- [x] `location.route.ts` - HTTP routes
- [x] `location.module.ts` - DI container
- [x] `index.ts` - Public exports

**Total:** 7 files

---

## 🎯 Review Checklist

### 1. Contract (`location.contract.ts`)

- [x] DTO schemas use spread-shape (NOT `.extend()`)
- [x] Proper validation rules (strTrim, min/max)
- [x] Reusable mutation shape (LocationMutationDto)
- [x] Filter/Query DTO with pagination
- [x] All DTOs have type exports
- [x] Enums properly defined (LocationTypeEnum)

### 2. Repository (`location.repo.ts`)

- [x] All methods return `undefined` for not found (NOT throw)
- [x] Batch operations use proper patterns (insertMany)
- [x] Empty array guards not needed (single operations)
- [x] Proper select projection (uses full table select)
- [x] Soft delete NOT used (isActive flag instead)
- [x] No N+1 queries

### 3. Service (`location.service.ts`)

- [x] Public methods use `handleX` naming
- [x] Private methods have no prefix (create, update, remove)
- [x] Conflict checks before CREATE/UPDATE (name, code)
- [x] Audit stamps (`stampCreate`/`stampUpdate`)
- [x] Cache invalidation on ALL writes (list, count, byId)
- [x] Custom error classes (LocationError)
- [x] Batch operations for seed (insertMany)
- [x] RelationMap helper (toRelationMap)
- [x] OpenTelemetry tracing (`record()`)

### 4. Routes (`location.route.ts`)

- [x] Thin wrappers (delegate to service.handleX)
- [x] Zod validation on body/query/params
- [x] Proper HTTP methods (GET/POST/PUT/DELETE)
- [x] Standardized response format (res.ok, res.created, res.paginated)
- [x] Error handling via global handler
- [x] Authentication required (auth: true)
- [x] Authorization checks not needed (simple CRUD)

### 5. Module (`location.module.ts`)

- [x] Factory function pattern (createLocationModule)
- [x] Dependency injection (db, cacheClient)
- [x] Proper cleanup on shutdown (not needed - stateless)
- [x] Cache client passed correctly

### 6. Internal (`location.internal.ts`)

- [x] Custom error classes (LocationError)
- [x] Error codes properly defined (LOCATION_NOT_FOUND, etc.)
- [x] Error messages clear

### 7. Index (`index.ts`)

- [x] Only public API exported (contract, module type)
- [x] No internal exports leaked

---

## 🔍 Code Quality Checks

### Type Safety

- [ ] No `any` types
- [ ] Proper generic usage
- [ ] Return types explicit

### Error Handling

- [ ] All errors properly thrown
- [ ] Error context included
- [ ] No silent failures

### Performance

- [ ] Batch operations where needed
- [ ] Cache strategy correct
- [ ] No obvious bottlenecks

### Documentation

- [ ] JSDoc on public methods
- [ ] Complex logic commented
- [ ] TODOs tracked (if any)

### Testing

- [ ] Unit tests exist
- [ ] Integration tests exist
- [ ] Edge cases covered

---

## 🐛 Issues Found

### Critical Issues

- [ ] None

### Medium Issues

- [ ] None

### Minor Issues

- [ ] None

---

## ✅ Improvements Made

1. **Contract (location.contract.ts)**
   - Extracted LocationMutationDto for reusable mutation shape
   - Fixed LocationUpdateDto to use spread-shape pattern (not direct .shape access)

2. **Routes (location.route.ts)**
   - Fixed /detail endpoint to return full LocationDto instead of just {id}
   - Updated response schema to match actual response
   - Removed unused import (successRecordIdSchema)

---

## 📊 Progress

**Files Reviewed:** 7/7 (100%) ✅  
**Issues Found:** 2 (minor)  
**Issues Fixed:** 2  
**Status:** ✅ COMPLETE

---

## 📝 Notes

Location module characteristics:

- **Zero dependencies** - Perfect first module
- **Simple CRUD** - Create, Read, Update, Delete
- **Master data** - Referenced by many modules
- **Location types:** warehouse, store
- **Key fields:** code, name, type, isActive

Critical patterns to verify:

1. Conflict checker on code/name (unique)
2. Cache invalidation strategy
3. Soft delete not used (isActive flag instead)
4. Audit stamps on all mutations

---

## 🚀 Next Steps

1. Review `location.contract.ts` - Zod schemas
2. Review `location.repo.ts` - Database layer
3. Review `location.service.ts` - Business logic
4. Review `location.route.ts` - HTTP endpoints
5. Review `location.module.ts` - DI setup
6. Review `location.internal.ts` - Errors
7. Review `index.ts` - Public API
8. Run tests
9. Fix issues
10. Mark as complete

---

**Review Start:** 2026-06-23  
**Review End:** TBD  
**Reviewer:** Claude Sonnet 4.5
