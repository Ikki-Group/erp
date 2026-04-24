# Identity and Access Management (IAM)

**Layer**: 1 (Master Data - Depends on Location)  
**Status**: MVP - Critical security foundation  
**Complexity**: High (RBAC, LBAC, permission enforcement, audit trails)

---

## 1. Overview

The IAM module is the foundational security layer that governs who can access what data and perform what actions. It implements **Role-Based Access Control (RBAC)** combined with **Location-Based Access Control (LBAC)** to ensure:
- Root admins see everything
- Location managers see only their location's data
- Staff see only data relevant to their assigned location and role

---

## 2. Core Objectives

- **Centralized Security**: Single point of control for all user identities, roles, and permissions
- **Location-Based Isolation (LBAC)**: All queries auto-filtered by user's assigned locations
- **Role-Based Permissions (RBAC)**: Define what actions each role can perform (create, read, update, approve)
- **Auditability**: Track who did what and when via createdBy/updatedBy on all records
- **High Performance**: Cached permissions and JWT tokens for low-latency auth checks

---

## 3. Key Entities & Relationships

```
User (Identity)
├─ id: 1
├─ username: "budi_manager"
├─ email: "budi@ikki.co.id"
├─ password_hash: "$argon2id$..." (immutable after set)
├─ status: "active" (active, suspended, locked)
├─ last_login: 2026-04-24T15:30:00Z
└─ is_root: false (root → superadmin, non-root → location-scoped)

Role (Permission Template)
├─ id: 1
├─ name: "outlet_manager"
├─ description: "Manager of single outlet location"
├─ permissions: [
│    "location:read",
│    "material:read",
│    "inventory:read",
│    "inventory:transfer",
│    "inventory:opname_approve",
│    "sales:read"
│  ]
└─ is_system: true (system roles immutable)

Permission (Fine-Grained Control)
├─ code: "inventory:transfer"
├─ description: "Can transfer stock between locations"
├─ module: "inventory"
└─ action: "transfer"

UserAssignment (Location Binding)
├─ user_id: FK → User
├─ location_id: FK → Location
├─ role_id: FK → Role
└─ assigned_at: 2026-04-20T10:00:00Z
   [User "budi" → Location "Ikki Coffee" → Role "outlet_manager"]

Relationships:
- User → UserAssignment (one-to-many: user at multiple locations)
- UserAssignment → Location (many-to-one: multiple users at one location)
- UserAssignment → Role (many-to-one: multiple users with same role)
- Role → Permission (many-to-many via RolePermission)
```

---

## 4. Use Cases & Workflows

### UC-001: Create User with Location Assignment (Onboarding new staff)

**Actors**: Admin, HR Manager  
**Precondition**: User needs access to system, location exists

**Steps**:
1. Admin opens User creation form
2. Enters: Username ("adi_barista"), Email ("adi@ikki.co.id"), Password (securely)
3. Sets: Status (Active)
4. Does NOT check "is_root" (is_root only for owner/GM)
5. Assigns to location + role:
   - Location: "Ikki Coffee"
   - Role: "Staff" (pre-defined system role)
6. System creates User record
7. System creates UserAssignment (adi → Ikki Coffee → Staff)
8. Adi can now:
   - Login with username/password → JWT token issued
   - Access Ikki Coffee data only (auto-filtered queries)
   - See staff-level permissions (read inventory, waste entry, etc.)
   - Cannot see Ikki Resto data
   - Cannot create POs (manager permission)

**Business Rules**:
- Username must be unique globally
- Email must be unique globally
- Password min 8 chars, strong policy (uppercase, number, symbol)
- Cannot assign non-root user without location
- Root users have implicit access to all locations

---

### UC-002: Assign User to Multiple Locations (Area manager covering 2 outlets)

**Actors**: Admin  
**Precondition**: User exists, locations exist

**Steps**:
1. Admin searches for user: "budi_manager"
2. Currently assigned to: Ikki Coffee (Manager role)
3. Admin clicks "Add Location Assignment"
4. Selects: Location "Ikki Resto", Role "Outlet Manager"
5. System creates second UserAssignment:
   - budi → Ikki Resto → Outlet Manager
6. Budi now has access to BOTH outlets
7. In dashboard, Budi can toggle between:
   - View Ikki Coffee data
   - View Ikki Resto data
   - View COMBINED data (both outlets)
8. All queries scoped to: location_ids IN (Ikki Coffee, Ikki Resto)

**Business Rules**:
- User can have 1-N location assignments
- Same role can apply to multiple locations, OR different roles
- Root users don't use UserAssignment (implicit global access)
- Cannot have duplicate user+location combinations

---

### UC-003: Update User Permissions (Promote staff to manager)

**Actors**: Admin  
**Precondition**: User exists with assignment

**Steps**:
1. Admin searches for user: "adi_barista"
2. Current role: "Staff" at Ikki Coffee
3. Admin wants to promote to "Manager"
4. Clicks "Change Role" → Selects "Outlet Manager"
5. System updates UserAssignment.role_id
6. Cache invalidated: LBAC_CACHE.USER_PERMISSIONS(adi_id)
7. On Adi's next API request:
   - Middleware fetches fresh permissions
   - Adi now has: create users, approve inventory transfers, manage location
   - Dashboard now shows "Manager" menu items

**Business Rules**:
- Changing role requires admin approval
- Change is logged (audit trail)
- Cache invalidation is immediate (next request sees new permissions)
- Cannot remove last location assignment (user would be orphaned)

---

### UC-004: Implement LBAC in Query (Auto-scoped filtering)

**Actors**: System (automatic in service layer)  
**Precondition**: Authenticated user making query

**Steps**:
1. Adi (Staff at Ikki Coffee) requests: GET /inventory/stock
2. Router receives request with `auth.userId = adi_id`
3. Service calls: `getUserAssignedLocations(adi_id)`
   - Returns: [Ikki Coffee location_id]
4. Service builds query:
   ```typescript
   const result = await inventoryRepo.getStock({
     location_ids: [ikki_coffee_id],  // Auto-scoped!
     ...filters
   })
   ```
5. Database returns ONLY Ikki Coffee stock
6. Result CANNOT include Ikki Resto data (filtered at query level)
7. Even if Adi manually tries: GET /inventory/stock?location_id=ikki_resto_id
   - Service re-validates location_ids against auth.locations
   - Returns 403 Forbidden if mismatch

**Business Rules**:
- LBAC filtering happens at service layer (before DB query)
- Cannot bypass with SQL injection (Drizzle prevents it)
- Root users skip location filter (see all)
- Explicit validation: throw error if requested location not in user's assigned list

---

## 5. Data Model

### User Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- Argon2id hash
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'locked')),
  is_root BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
)

CREATE UNIQUE INDEX idx_users_username ON users(username);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### Role Table

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT true, -- System roles immutable
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Permission Table

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL, -- e.g., "inventory:transfer"
  description TEXT,
  module VARCHAR(50), -- e.g., "inventory"
  action VARCHAR(50), -- e.g., "transfer"
  created_at TIMESTAMP DEFAULT NOW()
)
```

### RolePermission Table (Many-to-Many)

```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
)

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
```

### UserAssignment Table

```sql
CREATE TABLE user_assignments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  assigned_by INTEGER REFERENCES users(id),
  CONSTRAINT unique_user_location UNIQUE(user_id, location_id)
)

CREATE INDEX idx_user_assignments_user ON user_assignments(user_id);
CREATE INDEX idx_user_assignments_location ON user_assignments(location_id);
```

### Key Fields

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `username` | VARCHAR(50) | Login identifier | budi_manager |
| `email` | VARCHAR(255) | Contact + password reset | budi@ikki.co.id |
| `password_hash` | VARCHAR(255) | Hashed password (Argon2id) | $argon2id$... |
| `is_root` | BOOLEAN | Superadmin access (global) | false |
| `status` | VARCHAR(20) | active/suspended/locked | active |
| `location_id` | INTEGER | Location scoping (via assignment) | 1 (Ikki Coffee) |
| `role_id` | INTEGER | Permission template | 3 (Outlet Manager) |

---

## 6. Business Rules & Validations

**User Creation Rules**:
- Username: 3-50 alphanumeric + underscore, unique
- Email: valid format, unique
- Password: min 8 chars, must include uppercase + number + symbol
- Non-root users MUST have at least one location assignment
- Root users cannot be assigned to locations (implicit global access)

**User Update Rules**:
- Can change: email, status (active/suspended/locked), password
- Cannot change: username (immutable), is_root (requires special ceremony)
- Password changes require confirmation (for security)
- Suspended users cannot login but account data preserved

**Role Assignment Rules**:
- User can have 1-N roles per location (though typically 1)
- User can be assigned to 1-N locations with same or different roles
- Cannot have duplicate user+location combinations
- Changing role invalidates permission cache immediately

**Permission Checking Rules**:
- Check happens in 2 stages:
  1. **Authentication**: User exists + password valid + token not expired
  2. **Authorization**: User has required permission + location in scope
- Missing permission → 403 Forbidden (not 404 to avoid leaking resource existence)
- LBAC filter applied BEFORE permission check (double protection)

**Audit Trail Rules**:
- All user create/update: include createdBy / updatedBy
- All role changes logged: UserAssignmentAuditLog (Phase 2)
- Cannot modify historical logs (immutable append-only)

---

## 7. API Endpoints & Routes

### GET `/iam/users/list`
**Description**: List all users (admin only) or self  
**Auth**: Required  
**Query Params**:
```typescript
{
  page?: number,
  limit?: number,
  search?: string (username/email),
  status?: string (active, suspended, locked),
  location_id?: number (filter by location)
}
```
**Response**:
```json
{
  "success": true,
  "code": "OK",
  "data": [
    {
      "id": 1,
      "username": "budi_manager",
      "email": "budi@ikki.co.id",
      "status": "active",
      "is_root": false,
      "last_login": "2026-04-24T15:30:00Z",
      "assignments": [
        {
          "location_id": 1,
          "location_name": "Ikki Coffee",
          "role_id": 3,
          "role_name": "Outlet Manager"
        }
      ]
    }
  ]
}
```

### GET `/iam/users/:id`
**Description**: Get user detail with all assignments  
**Auth**: Required (self or admin)  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "budi_manager",
    "email": "budi@ikki.co.id",
    "status": "active",
    "is_root": false,
    "created_at": "2026-04-01T10:00:00Z",
    "assignments": [
      {
        "id": 10,
        "location_id": 1,
        "location_name": "Ikki Coffee",
        "role_id": 3,
        "role_name": "Outlet Manager",
        "permissions": ["location:read", "inventory:transfer", ...]
      }
    ]
  }
}
```

### POST `/iam/users/create`
**Description**: Create new user  
**Auth**: Required (Admin)  
**Body**:
```typescript
{
  username: "adi_barista",
  email: "adi@ikki.co.id",
  password: "SecurePass123!",
  status: "active",
  is_root: false
}
```
**Response**: 201 Created

### POST `/iam/users/:id/assign-location`
**Description**: Assign user to location with role  
**Auth**: Required (Admin)  
**Body**:
```typescript
{
  location_id: 1,
  role_id: 2
}
```
**Response**: 201 Created (UserAssignment)

### PUT `/iam/users/:id/assignments/:assignment_id`
**Description**: Update user's role at location  
**Auth**: Required (Admin)  
**Body**:
```typescript
{
  role_id: 3  // Change from Staff → Manager
}
```
**Response**: 200 OK

### POST `/iam/users/:id/change-password`
**Description**: User changes own password  
**Auth**: Required (authenticated user)  
**Body**:
```typescript
{
  current_password: "OldPass123!",
  new_password: "NewPass456!"
}
```
**Response**: 200 OK

### GET `/iam/roles/list`
**Description**: List all roles  
**Auth**: Optional  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "staff",
      "description": "Basic outlet staff (barista, chef)",
      "is_system": true,
      "permissions": ["location:read", "inventory:read", "inventory:waste_entry"]
    }
  ]
}
```

### GET `/iam/permissions/list`
**Description**: List all permissions  
**Auth**: Optional  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "inventory:transfer",
      "module": "inventory",
      "action": "transfer",
      "description": "Can transfer stock between locations"
    }
  ]
}
```

---

## 8. System Roles (Pre-defined)

| Role | Locations | Permissions | Use Case |
|------|-----------|-------------|----------|
| **Staff** | Single | read (location, inventory, material), waste_entry, opname_entry | Barista, Chef, Cashier |
| **Outlet Manager** | Single | All staff + inventory:transfer, inventory:opname_approve, material:update | Manager of one outlet |
| **Warehouse Manager** | Warehouse only | All operations + purchasing, all locations' stock | Warehouse manager |
| **Area Manager** | Multiple | All outlet managers + reporting across locations | Regional manager |
| **Admin** | All (implicit) | Full system access except user management | System administrator |
| **Root** | All (implicit) | Full system access including user management | Owner, General Manager |

---

## 9. Business Rules & Validations

**Password Policy**:
- Minimum 8 characters
- Must include: uppercase letter + lowercase letter + number + special character
- Cannot contain username or email
- History: cannot reuse last 5 passwords (Phase 2)

**Account Lockout**:
- 5 failed login attempts → account locked
- Locked accounts require admin reset
- Suspicious activity (same IP multiple locations) → alert (Phase 2)

**Session Management**:
- JWT access token: 2-hour TTL
- Refresh token: 7-day TTL
- One active session per user (Phase 2: multiple sessions possible)
- Logout invalidates all tokens (server-side token blacklist)

---

## 10. Integration Points

### Upstream Dependencies:
- **Location** (Layer 0): UserAssignment references locations

### Downstream Dependencies:
- **Auth** (Layer 1.5): IAM users + roles form authentication basis
- **All Modules** (Layer 1-3): Depend on IAM for auth guards and LBAC filtering

### Data Flow:
```
User (identity)
  ├─ Location Assignment (multi-location support)
  ├─ Role (permission template)
  └─ Permissions (module:action fine-grained control)
      ↓
    JWT Token (stateless auth)
      ↓
    Auth Middleware (validates token, extracts user context)
      ↓
    Service Layer LBAC (filters queries by user's locations)
      ↓
    Permission Check (verify action allowed)
      ↓
    Execute Operation
```

---

## 11. Implementation Notes

### Caching Strategy
```typescript
const LBAC_CACHE_KEYS = {
  USER_LOCATIONS: (userId: number) => `lbac.user.locations.${userId}`,
  USER_PERMISSIONS: (userId: number) => `lbac.user.permissions.${userId}`,
  ROLE_PERMISSIONS: (roleId: number) => `lbac.role.permissions.${roleId}`,
}

// Cache TTL: 1 hour (permissions change infrequently)
// Invalidate on: role change, permission change, location assignment change
```

### LBAC Implementation Pattern
```typescript
// In service, before any query:
const userLocations = await cache.getOrSet({
  key: LBAC_CACHE_KEYS.USER_LOCATIONS(userId),
  factory: async () => getUserAssignedLocations(userId),
  ttl: 3600,
})

// Filter query
const result = await repo.getList({
  ...filters,
  location_ids: userLocations,  // Auto-scoped
})

// Explicit validation (defense in depth)
if (!userLocations.includes(requestedLocationId)) {
  throw new ForbiddenError('Not authorized for this location')
}
```

### Permission Checking Pattern
```typescript
// Simple permission check
const hasPermission = userPermissions.includes('inventory:transfer')
if (!hasPermission) {
  throw new ForbiddenError('Permission denied: inventory:transfer')
}

// Can be optimized with bitmask (future optimization)
```

---

## 12. Future Enhancements (Phase 2+)

- **Audit Logs**: Immutable log of who accessed what data when
- **Session Management Dashboard**: View/terminate active sessions
- **Multi-Factor Authentication (MFA)**: TOTP or SMS for sensitive operations
- **Role Hierarchy**: Parent roles inherit child role permissions
- **Automatic Provisioning**: HR system auto-creates accounts on hire
- **SSO Integration**: LDAP/OAuth for enterprise customers
- **IP Whitelisting**: Restrict access by location (e.g., only from store WiFi)

---

**Module Status**: ✅ MVP-Ready  
**Dependencies**: Location (Layer 0)  
**Estimated Implementation**: 12-15 hours
