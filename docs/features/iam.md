# Identity & Access Management (IAM)

**Layer**: 1 (Master Data) | **Status**: MVP | **Priority**: Critical | **Estimate**: 20 hours

---

## 1. Overview

UMKM outlets have different staff roles: baristas see only their outlet, managers see outlet + warehouse, owners see everything. IAM controls who can access what data and perform what actions, using Role-Based Access Control (RBAC) + Location-Based Access Control (LBAC).

---

## 2. Core Objectives

- **Role-Based Permissions**: Define what each role can do (create PO, approve inventory, view sales, etc)
- **Location-Based Filtering**: Barista sees only their outlet data (Ikki Coffee), manager sees multiple outlets they're assigned to, owner sees all
- **User-to-Location Binding**: Admin assigns staff to locations with specific roles
- **Audit Trail**: Every action tracked with "who did this" (createdBy/updatedBy on all records)
- **Permission Caching**: Fast permission checks (no database lookup per request)

---

## 3. Use Cases & Workflows

### UC-001: Admin Creates New Staff Member (Onboarding)

**Who**: Admin / HR Manager  
**When**: New staff hired  
**Goal**: Give staff access to system with correct permissions

**Steps**:
1. Admin opens "Create User" form
2. Enters: Username "adi_barista", Email "adi@ikki.co.id", Password
3. Assigns: Location "Ikki Coffee", Role "Barista"
4. System creates User + UserAssignment record
5. Adi can now:
   - Login to system
   - See Ikki Coffee inventory, sales, recipes only
   - Cannot see Ikki Resto data
   - Cannot create purchase orders (manager only)

**Why it matters**: 
- Clean separation (data isolation by location)
- Role-based limits (barista can't do manager tasks)
- Onboarding fast (one form)

---

### UC-002: Promote Staff to Manager (Role change)

**Who**: Admin  
**When**: Barista promoted to outlet manager  
**Goal**: Give staff higher permissions

**Steps**:
1. Admin finds user "adi_barista"
2. Current: Ikki Coffee Barista
3. Admin changes role to "Outlet Manager"
4. Adi's permissions now include: Create PO, Approve inventory transfers, View analytics
5. Adi's existing outlet assignment stays (Ikki Coffee)

**Why it matters**: 
- Easy promotion (just change role)
- No need to recreate user
- New permissions active immediately

---

### UC-003: Assign Staff to Multiple Locations (Area manager)

**Who**: Admin  
**When**: Manager covers multiple outlets  
**Goal**: Give manager access to both outlets

**Steps**:
1. Admin finds "budi_manager" (currently assigned to Ikki Coffee as Outlet Manager)
2. Admin clicks "Add Location"
3. Selects: Ikki Resto + Role "Outlet Manager"
4. Budi now has access to BOTH outlets
5. In dashboard, Budi can toggle: "View Ikki Coffee" or "View Ikki Resto" or "View Both"

**Why it matters**: 
- Flexible coverage (one manager covers multiple outlets)
- Clear role (same or different role per location)
- Owner visibility (can see consolidated data)

---

## 4. Recommended Enhancements (Phase 2+)

- **Role Customization**: Create custom roles instead of just system roles
  - Priority: Nice-to-have (small chains may need custom permissions)
  - Why: Flexibility for unique org structures
  - Estimate: 16 hours

- **Permission Audit Log**: View who changed permissions, when, what changed
  - Priority: Nice-to-have (compliance/audit trail)
  - Why: Track all permission changes (security)
  - Estimate: 8 hours

- **Temporary Role Elevation**: Grant higher permissions for limited time
  - Priority: Nice-to-have (cover manager absence)
  - Why: Auto-expire temp permissions (don't forget to revoke)
  - Estimate: 12 hours

- **Bulk User Import**: Upload CSV of staff + assignments
  - Priority: Nice-to-have (large chains onboarding)
  - Why: Faster setup than one-by-one
  - Estimate: 10 hours
