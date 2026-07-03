# Schema Review: iam.ts

**Date:** 2026-06-23  
**Reviewer:** AI + Solo Developer  
**Status:** 🔄 IN REVIEW

---

## 📊 Current Schema

### 1. Roles Table

```typescript
export const rolesTable = pgTable(
	'roles',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		description: text('description'),
		permissions: text('permissions')
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		isSystem: boolean('is_built_in').notNull().default(false),
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('roles_code_idx').on(t.code)],
)
```

### 2. Users Table

```typescript
export const usersTable = pgTable(
	'users',
	{
		...pk,
		email: text('email').notNull(),
		username: text('username').notNull(),
		fullname: text('fullname').notNull(),
		pinCode: text('pin_code'),
		passwordHash: text('password_hash'),
		isRoot: boolean('is_root').notNull().default(false),
		isSystem: boolean('is_built_in').notNull().default(false),
		isActive: boolean('is_active').notNull().default(true),
		defaultLocationId: integer('default_location_id').references(() => locationsTable.id, {
			onDelete: 'set null',
		}),
		lastLoginAt: timestamp('last_login_at', { mode: 'date', withTimezone: true }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('users_email_idx').on(t.email),
		uniqueIndex('users_username_idx').on(t.username),
		index('users_default_location_idx').on(t.defaultLocationId),
	],
)
```

### 3. User Assignments Table

```typescript
export const userAssignmentsTable = pgTable(
	'user_assignments',
	{
		...pk,
		userId: integer('user_id')
			.notNull()
			.references(() => usersTable.id, { onDelete: 'cascade' }),
		roleId: integer('role_id')
			.notNull()
			.references(() => rolesTable.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		addedAt: timestamp('added_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
		addedBy: integer('added_by').references(() => usersTable.id, { onDelete: 'set null' }),
	},
	(t) => [
		index('user_assignments_user_idx').on(t.userId),
		index('user_assignments_role_idx').on(t.roleId),
		index('user_assignments_location_idx').on(t.locationId),
		uniqueIndex('user_assignments_user_location_idx').on(t.userId, t.locationId),
	],
)
```

---

## ✅ Strengths

### 1. **Excellent Documentation** ⭐⭐⭐⭐⭐

```typescript
/**
 * Roles Table
 *
 * Defines a named permission set assignable to users per location.
 *
 * `code`      — stable, normalized (slug-like) machine identifier derived from
 *               `name`. Used in application logic and seeding. Never changes
 *               after creation.
 *
 * `isBuiltIn` — true for roles created by the system seeder. Built-in roles
 *               are protected from mutation and deletion by the service layer.
 */
```

**✅ Very clear:** Business rules, field purposes, constraints explained

---

### 2. **LBAC (Location-Based Access Control) Design** ⭐⭐⭐⭐⭐

**Core Concept:**

- Users granted roles **per location**
- One role per user per location
- Root users have implicit superadmin access everywhere

**Well Designed:**

```typescript
// Natural key: userId + locationId
uniqueIndex('user_assignments_user_location_idx').on(t.userId, t.locationId)
```

**✅ Excellent:** Prevents duplicate role assignments at same location

---

### 3. **Proper Foreign Key Cascades** ⭐⭐⭐⭐⭐

```typescript
// Users deleted → assignments deleted
userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' })

// Role deleted → prevent if in use
roleId: integer('role_id').references(() => rolesTable.id, { onDelete: 'restrict' })

// Location deleted → prevent if has assignments
locationId: integer('location_id').references(() => locationsTable.id, { onDelete: 'restrict' })
```

**✅ Perfect:** Protects data integrity while allowing cleanup

---

### 4. **Audit Trail** ⭐⭐⭐⭐⭐

```typescript
// Who added this assignment
addedBy: integer('added_by').references(() => usersTable.id, { onDelete: 'set null' })
```

**✅ Good:** Tracks assignment creator without blocking user deletion

---

### 5. **Proper Indexes** ⭐⭐⭐⭐⭐

```typescript
// Query patterns covered:
index('user_assignments_user_idx').on(t.userId),      // Get user's assignments
index('user_assignments_role_idx').on(t.roleId),      // Get role usage
index('user_assignments_location_idx').on(t.locationId), // Get location users
```

**✅ Excellent:** All FK columns indexed for performance

---

## ⚠️ Issues & Improvements

### **CRITICAL: Field Name Mismatch** 🔴

**Problem:**

```typescript
// Schema uses:
isSystem: boolean('is_built_in') // ❌ Column name: is_built_in

// Contract uses:
isSystem: zp.bool // ✅ Field name: isSystem
```

**Impact:**

- Code uses `isSystem` but DB column is `is_built_in`
- **THIS IS THE SCHEMA BLOCKER** we identified earlier!
- Causes test failures
- Migration drift

**Affected Tables:**

- `rolesTable.isSystem` → column `is_built_in`
- `usersTable.isSystem` → column `is_built_in`

---

**Solution:**

#### Option A: Rename DB Column (Recommended)

```typescript
// Change schema to match code
isSystem: boolean('is_system').notNull().default(false)
```

**Pros:**

- ✅ Consistent naming (camelCase → snake_case)
- ✅ Matches contract expectations
- ✅ Fixes test failures

**Cons:**

- Requires migration (simple ALTER COLUMN)

---

#### Option B: Change Code to Match DB

```typescript
// Change contract to match DB
isBuiltIn: zp.bool // Rename everywhere in code
```

**Pros:**

- No migration needed

**Cons:**

- ❌ More code changes
- ❌ Breaking change in API
- ❌ `isBuiltIn` less clear than `isSystem`

---

**Recommendation:** **Option A** (Rename DB column to `is_system`)

- Clearer naming (`isSystem` > `isBuiltIn`)
- Matches modern convention
- Aligns with contract layer

---

### **MINOR: Missing Index on Active Users** 🟡

**Common Query Pattern:**

```sql
-- Get active users
SELECT * FROM users WHERE is_active = TRUE;

-- Get active users at location
SELECT * FROM users u
JOIN user_assignments ua ON u.id = ua.user_id
WHERE u.is_active = TRUE AND ua.location_id = ?;
```

**Current:** No index on `is_active`

**Recommendation:**

```typescript
index('users_active_idx').on(t.isActive),
```

**Benefit:**

- Faster "list active users" queries
- Small overhead (boolean, low cardinality)

**Trade-off:**

- Boolean indexes can be inefficient (2 values only)
- Partial index might be better: `WHERE is_active = TRUE`

**Better Solution (if needed):**

```typescript
import { eq } from 'drizzle-orm'

index('users_active_idx')
	.on(t.id) // or relevant columns
	.where(eq(t.isActive, true))
```

---

### **MINOR: No Validation on Permissions Array** 🟡

**Current:**

```typescript
permissions: text('permissions')
	.array()
	.notNull()
	.default(sql`'{}'::text[]`)
```

**Issue:**

- No format validation at DB level
- Can store invalid permission strings
- Example: `["iam.user.read", "invalid_garbage"]`

**Solutions:**

#### Option A: Check Constraint (DB-level)

```typescript
// Add in table definition:
check(
	'roles_permissions_format_chk',
	sql`permissions <@ ARRAY['iam.user.read', 'iam.user.write', ...]::text[]`,
)
```

**Pros:** Database enforces valid values  
**Cons:** Hard to maintain (must update schema when adding permissions)

---

#### Option B: Application-Level Validation (Recommended)

```typescript
// role.contract.ts
const PermissionEnum = z.enum([
	'iam.user.read',
	'iam.user.write',
	'iam.role.read',
	// ... etc
])

export const RoleCreateDto = z.object({
	permissions: z.array(PermissionEnum).default([]),
})
```

**Pros:**

- ✅ Easy to maintain
- ✅ Type-safe
- ✅ Clear error messages
- ✅ Flexible (add permissions without migration)

**Cons:**

- No DB-level enforcement (rely on application)

**Recommendation:** **Option B** (Application-level)

---

### **MINOR: Missing Composite Index for Common Query** 🟡

**Common Query Pattern:**

```sql
-- Get user's assignments at specific location
SELECT * FROM user_assignments
WHERE user_id = ? AND location_id = ?;
```

**Current Index:**

```typescript
uniqueIndex('user_assignments_user_location_idx').on(t.userId, t.locationId)
```

**✅ Already Covered!** Unique index serves as lookup index too.

---

### **DESIGN: lastLoginAt on Users Table** 🟡

**Current:**

```typescript
lastLoginAt: timestamp('last_login_at', { mode: 'date', withTimezone: true })
```

**Question:** Should this be in `users` or `sessions`?

**Current Design:** `users` table (last login timestamp)

**Alternative:** Track in `sessions` table (per-session login time)

**Trade-offs:**

| Approach               | Pros                                | Cons                                            |
| ---------------------- | ----------------------------------- | ----------------------------------------------- |
| **In users (current)** | Quick access, simple                | Write contention on login, not session-specific |
| **In sessions**        | Per-session tracking, no contention | Need JOIN to get last login                     |

**Recommendation:** **Keep in users table**

- Common use case: "when did user last login?"
- Acceptable write contention (login is not high-frequency)
- Simpler queries

---

## 📝 Summary

| Category          | Rating     | Notes                                       |
| ----------------- | ---------- | ------------------------------------------- |
| **Documentation** | ⭐⭐⭐⭐⭐ | Excellent business rules                    |
| **LBAC Design**   | ⭐⭐⭐⭐⭐ | Perfect implementation                      |
| **Foreign Keys**  | ⭐⭐⭐⭐⭐ | Correct cascades                            |
| **Indexing**      | ⭐⭐⭐⭐   | Good, minor optimization possible           |
| **Naming**        | ⭐⭐⭐     | **CRITICAL: is_built_in vs isSystem**       |
| **Constraints**   | ⭐⭐⭐⭐   | Good, validation in app layer               |
| **Overall**       | ⭐⭐⭐⭐   | Excellent design, one critical naming issue |

---

## 🎯 Recommended Actions

### **Priority 1: Fix Field Name Mismatch** 🔴

**Action:** Rename DB columns from `is_built_in` to `is_system`

**Files to Change:**

1. `iam.ts` schema file

   ```typescript
   // roles table
   isSystem: boolean('is_system').notNull().default(false)

   // users table
   isSystem: boolean('is_system').notNull().default(false)
   ```

**Effort:** 2 minutes (schema change only)  
**Impact:** ⭐⭐⭐⭐⭐ (Fixes blocker, unblocks tests)

---

### **Priority 2: Add Active Users Index** 🟡

**Action:** Add index for active users filtering

```typescript
index('users_active_idx').on(t.isActive)
// OR partial index if filtering active only:
// index('users_active_idx').on(t.id).where(eq(t.isActive, true))
```

**Effort:** 1 minute  
**Impact:** ⭐⭐⭐ (Performance improvement)

---

### **Priority 3: Document Permissions Enum** 🟡

**Action:** Create centralized permission enum in contract layer

**Effort:** 15 minutes  
**Impact:** ⭐⭐ (Better type safety, not schema change)

---

## 💡 Schema Best Practices Applied

✅ **LBAC Design** - Location-based access control  
✅ **Proper Cascades** - cascade/restrict/set null used correctly  
✅ **Audit Trail** - addedBy, addedAt tracked  
✅ **Unique Constraints** - Natural keys identified  
✅ **Indexed FKs** - All foreign keys indexed  
✅ **Documentation** - Excellent comments  
⚠️ **Naming** - Critical mismatch to fix

---

**Status:** ✅ Schema is excellent, one critical naming fix needed  
**Next:** Apply fixes and generate migration
