# Module Dependency Map - Ikki ERP

**Date:** 2026-06-23  
**Purpose:** Track module dependencies for implementation order

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

### Phase 1: Core Foundation (Week 1)
1. ✅ `location` - Simplest, no dependencies (COMPLETE - b6d4b530)
2. ✅ `iam` - User/Role management (COMPLETE - TBD)
3. ⏳ `auth` - Authentication (depends on iam)
4. ⏳ `session` - Session management (depends on iam, location)

### Phase 2: Master Data (Week 2)
5. ✅ `company` - Company settings (COMPLETE - ccdff95d)
6. ⏳ `supplier` - Supplier data
7. ⏳ `material` - Materials & UoM
8. ⏳ `payment` - Payment methods
9. ⏳ `sales-type` - Sales types

### Phase 3: Product & Recipe (Week 3)
10. ⏳ `product` - Products & variants
11. ⏳ `recipe` - BOM/Recipe
12. ⏳ `crm` - Customer management
13. ⏳ `hr` - HR & Payroll

### Phase 4: Operations (Week 4-5)
14. ⏳ `inventory` - Stock management
15. ⏳ `sales` - Sales orders
16. ⏳ `purchasing` - Purchase orders
17. ⏳ `production` - Work orders

### Phase 5: Finance & Integration (Week 6)
18. ⏳ `finance` - Accounting
19. ⏳ `moka` - POS integration

### Phase 6: Analytics (Week 7)
20. ⏳ `reporting` - Reports
21. ⏳ `dashboard` - Dashboards
22. ⏳ `audit` - Audit logs

---

## 📋 Module Status Legend

- ✅ **Complete** - Reviewed, tested, production-ready
- 🔄 **In Progress** - Currently being refined
- ⏳ **Pending** - Not started, waiting for dependencies
- ⚠️ **Blocked** - Waiting for dependency completion
- 🔴 **Issues** - Has problems that need fixing

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
| material | - | inventory, recipe, purchasing |
| payment | - | sales, finance |
| sales-type | location | sales |
| product | material (via recipe) | sales, production |
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

**Next Action:** Start with `location` module refinement
