# Module Dependency Map - Ikki ERP

**Date:** 2026-06-24  
**Purpose:** Track module dependencies for implementation order  
**Last Updated:** 2026-06-24 (10/22 modules complete - 45.5%)

---

## 📊 Module Layers (Based on Dependencies)

### Layer 0: Core Authentication & Session
**No business dependencies** - Pure authentication/session management

- `auth` - Authentication (login, logout, token)
- `session` - Session management

### Layer 1: Master Data (Foundation)
**No cross-module dependencies** - Independent master tables

1. `location` - Locations (warehouse, store)
2. `iam` - Users, Roles, Permissions (depends on location for defaultLocationId)
3. `company` - Company settings
4. `supplier` - Supplier master data
5. `material` - Materials & UoM (raw materials, categories)

### Layer 2: Master Data (With Dependencies)
**Depends on Layer 1 only**

6. `sales-type` - Sales types (depends on location)
7. `product` - Products & Variants (depends on material indirectly via recipe)
8. `recipe` - Recipe/BOM (depends on material, product)
9. `crm` - Customer management (independent but used by sales)
10. `hr` - HR & Payroll (depends on iam/location for employees)
11. `payment` - Payment methods & providers (independent)

### Layer 3: Operational Modules
**Depends on Layer 1 & 2**

12. `inventory` - Stock management (depends on material, location)
13. `sales` - Sales orders (depends on product, customer, location, sales-type)
14. `purchasing` - Purchase orders (depends on material, supplier, location)
15. `production` - Work orders (depends on recipe, material, location)
16. `finance` - Accounting (depends on many modules for journal entries)

### Layer 4: Integration & Reporting
**Depends on operational modules**

17. `moka` - Moka POS integration (depends on sales, product)
18. `reporting` - Reports & analytics (depends on all operational)
19. `dashboard` - Dashboard aggregations (depends on all operational)
20. `audit` - Audit logs (tracks all module changes)

### Special Modules
- `shared` - Shared utilities (no dependencies)
- `tool` - Development tools

---

## 🎯 Implementation Order (Recommended)

### Phase 1: Core Foundation ✅ 4/4 COMPLETE
1. ✅ `location` - 7 files (COMPLETE - b6d4b530)
2. ✅ `iam` - 18 files, 4 submodules (COMPLETE - 841ecf3b)
3. ✅ `auth` - 6 files, reviewed clean (COMPLETE)
4. ✅ `session` - 5 files, reviewed clean (COMPLETE)

### Phase 2: Master Data ✅ 7/7 COMPLETE
5. ✅ `company` - 5 files (COMPLETE - ccdff95d)
6. ✅ `supplier` - 5 files (COMPLETE - 3ebc2b7f)
7. ✅ `uom` - 7 files, standalone module (COMPLETE - 85bae9c0)
8. ✅ `material` - 34 files, 5 submodules (COMPLETE - 7c4819b2, 3d1b7eed)
9. ✅ `payment` - 17 files, 4 submodules (COMPLETE - 2357a941)
10. ✅ `sales-type` - 5 files (COMPLETE - f5ad29c1)

### Phase 3: Product & Recipe 🔄 2/4 IN PROGRESS
11. ✅ `product` - 9 files, 2 submodules (COMPLETE - 4630fdf5)
12. ✅ `crm` - 5 files, customer management (COMPLETE - 438d2351)
13. ⏳ `recipe` - BOM/Recipe
14. ⏳ `hr` - HR & Payroll

### Phase 4: Operations (Ready - Dependencies Complete)
15. ⏳ `inventory` - Stock management (deps: ✅ material, ✅ location)
16. ⏳ `sales` - Sales orders (deps: ✅ product, ⏳ crm, ✅ location, ⏳ sales-type)
17. ⏳ `purchasing` - Purchase orders (deps: ✅ material, ✅ supplier, ✅ location)
18. ⏳ `production` - Work orders (deps: ⏳ recipe, ✅ material, ✅ location)

### Phase 5: Finance & Integration
19. ⏳ `finance` - Accounting
20. ⏳ `moka` - POS integration

### Phase 6: Analytics
21. ⏳ `reporting` - Reports
22. ⏳ `dashboard` - Dashboards
23. ⏳ `audit` - Audit logs

---

## 📋 Module Status Legend

- ✅ **Complete** - Latest standards applied (handleX, Zod v4, EntityRef, spread-shape, cache.keys)
- 🔄 **In Progress** - Currently being refined
- ⏳ **Pending** - Not started, waiting for dependencies
- ⚠️ **Blocked** - Waiting for dependency completion
- 🔴 **Issues** - Has problems that need fixing

## 📊 Progress Summary

**Total Modules:** 22 (excluding shared/tool)  
**Complete:** 10 (45.5%) ⬆️  
**In Progress:** 0  
**Pending:** 12 (54.5%)

**Completion by Phase:**
- Phase 1 (Core): 4/4 (100%) ✅ - location, iam, auth, session
- Phase 2 (Master): 7/7 (100%) ✅ - company, supplier, uom, material, payment, sales-type
- Phase 3 (Product): 2/4 (50%) 🔄 - product, crm
- Phase 4 (Operations): 0/4 (0%) - inventory, sales, purchasing, production
- Phase 5-6 (Finance & Analytics): 0/7 (0%)

---

## 🔍 Dependency Matrix

| Module | Depends On | Used By |
|--------|-----------|---------|
| location | - | iam, sales-type, all operational |
| iam | location | auth, session, all modules (audit) |
| auth | iam | all authenticated endpoints |
| session | iam, location | auth, all endpoints |
| company | - | finance, settings |
| supplier | - | purchasing, finance |
| uom | - | material (extracted standalone) |
| material | uom | inventory, recipe, purchasing |
| payment | - | sales, finance |
| sales-type | location | sales |
| product | material, uom | sales, production |
| recipe | material, product | production |
| crm | - | sales |
| hr | iam, location | payroll, attendance |
| inventory | material, location | sales, production, purchasing |
| sales | product, crm, location, sales-type | finance, reporting |
| purchasing | material, supplier, location | inventory, finance |
| production | recipe, material, location | inventory, finance |
| finance | many | reporting, dashboard |
| moka | sales, product | - |
| reporting | all operational | dashboard |
| dashboard | all operational | - |
| audit | all | - |

---

## 📝 Notes

- **Location is the most critical** - Almost all modules depend on it
- **IAM is second** - All authenticated operations need users
- **Auth/Session** form the security foundation
- **Inventory** is central to operational flow
- **Finance** depends on many modules (implement last in operational)

---

## 🎯 Latest Standards Applied

All completed modules follow these patterns:
- ✅ **Naming**: `handleCreate/Update/Remove` for public service methods
- ✅ **Repo**: Returns `undefined` (NOT throw), service handles errors
- ✅ **Types**: `EntityRef` (NOT RecordId), proper typed ConflictField
- ✅ **Zod v4**: Spread-shape (NOT `.extend()`), `.transform()` (NOT `.toUpperCase()`)
- ✅ **Cache**: `cache.keys.*` (NOT string literals), `deleteFromKeys` method
- ✅ **Imports**: `@/shared/schema` (NOT `@ikki/api-contract/validation`)
- ✅ **Tracing**: OpenTelemetry `record()` wrapper on all service methods
- ✅ **Audit**: `stampCreate/stampUpdate` on all mutations

---

**Next Action:** Continue with sales-type or inventory (dependencies ready)
