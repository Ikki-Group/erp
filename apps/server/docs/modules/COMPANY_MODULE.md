# Company Module - Refinement Checklist

**Module:** `company`  
**Layer:** Layer 1 (Master Data - Foundation)  
**Dependencies:** None  
**Status:** ✅ COMPLETE

---

## 📂 File Inventory

- [x] `company-settings.schema.ts` - DTOs & validation
- [x] `company-settings.repo.ts` - Data access
- [x] `company-settings.service.ts` - Business logic
- [x] `company-settings.route.ts` - HTTP endpoints
- [x] `index.ts` - Public exports

**Total:** 5 files

---

## 🎯 Review Checklist

### 1. Schema (`company-settings.schema.ts`) ✅

- [x] Import path fixed (@ikki/api-contract → @/shared/schema)
- [x] Removed .extend() (Zod v4 deprecated)
- [x] Renamed Schema → Dto (consistency)
- [x] Extract CompanySettingsMutationDto
- [x] Email/URL validation (z.string().email/url())
- [x] Type exports

### 2. Repository (`company-settings.repo.ts`) ✅

- [x] Returns undefined for not found
- [x] Audit stamps (stampCreate, stampUpdate)
- [x] Proper EntityRef return

### 3. Service (`company-settings.service.ts`) ✅

- [x] OpenTelemetry tracing (all methods)
- [x] handleX naming for public methods
- [x] Cache keys use cache.keys.\* (not string literals)
- [x] Cache invalidation proper
- [x] Custom errors (err helper object)
- [x] Single instance check (handleCreate)

### 4. Routes (`company-settings.route.ts`) ✅

- [x] Import path fixed
- [x] Thin wrappers (delegate to service)
- [x] Zod validation
- [x] Auth required
- [x] Standard responses

### 5. Index (`index.ts`) ✅

- [x] Public API only (module, service type, DTOs)
- [x] No internal leaks

---

## 🐛 Issues Found & Fixed

### Critical Issues

- None

### Medium Issues

1. ✅ Wrong import path (@ikki/api-contract)
2. ✅ Deprecated .extend() method (Zod v4)

### Minor Issues

1. ✅ Schema → Dto naming inconsistency
2. ✅ No OpenTelemetry tracing
3. ✅ Cache keys as string literals
4. ✅ Deprecated .email()/.url() chaining

---

## ✅ Improvements Made

1. **Import paths**
   - Changed @ikki/api-contract/validation → @/shared/schema
   - Fixed in schema.ts and route.ts

2. **Zod v4 compatibility**
   - Removed .extend() usage
   - Fixed email/url validation (z.string().email/url())
   - Extract mutation shape

3. **Naming consistency**
   - CompanySettingsSchema → CompanySettingsDto
   - Applied across all files

4. **OpenTelemetry tracing**
   - Added record() wrapper to all service methods
   - Proper service name prefix

5. **Cache strategy**
   - Fixed cache keys to use cache.keys.list/byId/count
   - Changed deleteMany → deleteFromKeys

---

## 📊 Progress

**Files Reviewed:** 5/5 (100%)  
**Issues Found:** 6  
**Issues Fixed:** 6  
**Status:** ✅ PRODUCTION READY

---

## 📝 Notes

Company module characteristics:

- **Zero dependencies** - Independent master data
- **Single instance** - One company settings record
- **Settings singleton** - Prevents multiple entries
- **Key fields:** name, address, email, taxId, taxRate, currency

Critical patterns verified:

1. Single instance check in handleCreate
2. Cache invalidation on writes
3. Audit stamps on mutations
4. OpenTelemetry tracing
5. Zod v4 compatible schemas

---

## 🚀 Next Steps

1. ✅ Review schema - Fixed imports, deprecated methods
2. ✅ Review repo - Verified patterns
3. ✅ Review service - Added tracing, fixed cache
4. ✅ Review routes - Fixed imports
5. ✅ Review index - Verified exports
6. ✅ Create documentation
7. ✅ Commit changes

---

**Review Date:** 2026-06-24  
**Reviewer:** Claude Sonnet 4.5
