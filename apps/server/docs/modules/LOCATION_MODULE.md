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
- [ ] DTO schemas use spread-shape (NOT `.extend()`)
- [ ] Proper validation rules (email, phone, etc.)
- [ ] Reusable mutation shape
- [ ] Filter/Query DTO with pagination
- [ ] All DTOs have type exports
- [ ] Enums properly defined

### 2. Repository (`location.repo.ts`)
- [ ] All methods return `null` for not found (NOT throw)
- [ ] Batch operations use `inArray()`
- [ ] Empty array guards on batch operations
- [ ] Proper select projection
- [ ] Soft delete support (if applicable)
- [ ] No N+1 queries

### 3. Service (`location.service.ts`)
- [ ] Public methods use `handleX` naming
- [ ] Private methods have no prefix
- [ ] Conflict checks before CREATE/UPDATE
- [ ] Audit stamps (`stampCreate`/`stampUpdate`)
- [ ] Cache invalidation on ALL writes
- [ ] Custom error classes (NotFoundError, etc.)
- [ ] Batch operations for relationships
- [ ] RelationMap for in-memory JOINs
- [ ] OpenTelemetry tracing (`record()`)

### 4. Routes (`location.route.ts`)
- [ ] Thin wrappers (delegate to service)
- [ ] Zod validation on body/query/params
- [ ] Proper HTTP methods (GET/POST/PATCH/DELETE)
- [ ] Standardized response format
- [ ] Error handling via global handler
- [ ] Authentication required
- [ ] Authorization checks (if needed)

### 5. Module (`location.module.ts`)
- [ ] Factory function pattern
- [ ] Dependency injection
- [ ] Proper cleanup on shutdown
- [ ] Cache client passed correctly

### 6. Internal (`location.internal.ts`)
- [ ] Custom error classes
- [ ] Error codes properly defined
- [ ] Error messages clear

### 7. Index (`index.ts`)
- [ ] Only public API exported
- [ ] No internal exports leaked

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

- [ ] None yet

---

## 📊 Progress

**Files Reviewed:** 0/7 (0%)  
**Issues Found:** 0  
**Issues Fixed:** 0

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
