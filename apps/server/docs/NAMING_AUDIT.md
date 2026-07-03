# Method Naming Audit - Phase C

**Date:** 2026-06-22  
**Scope:** Active modules (iam, location, auth, session)

---

## 📊 Current State

### Public Method Inventory

| Module       | Method           | Pattern         | Status              | Action                           |
| ------------ | ---------------- | --------------- | ------------------- | -------------------------------- |
| **iam/role** | `handleDetail`   | ❌ Inconsistent | Non-standard        | → `handleGetById`                |
| **iam/role** | `handleRemove`   | ❌ Inconsistent | Non-standard        | → `handleDelete`                 |
| **iam/user** | `handleRemove`   | ❌ Inconsistent | Non-standard        | → `handleDelete`                 |
| **iam/user** | `getListAll`     | ⚠️ Non-standard | Public, no `handle` | → Make private or `handleGetAll` |
| **iam/user** | `getRelationMap` | ⚠️ Non-standard | Public, no `handle` | → Make private or keep (helper)  |
| **location** | `handleDetail`   | ❌ Inconsistent | Non-standard        | → `handleGetById`                |
| **location** | `handleRemove`   | ❌ Inconsistent | Non-standard        | → `handleDelete`                 |
| **location** | `getListAll`     | ⚠️ Non-standard | Public, no `handle` | → Make private or `handleGetAll` |

---

## 🎯 Standardization Plan

### 1. Core CRUD Methods (Standard Pattern)

**Format:** `handleX` for all public HTTP-facing operations

```typescript
// ✅ STANDARD (Keep as-is)
async handleCreate(dto, actor): Promise<EntityRef>
async handleUpdate(dto, actor): Promise<EntityRef>
async handleList(filter): Promise<WithPaginationResult<Dto>>

// ❌ NON-STANDARD (Must change)
async handleDetail(id) → async handleGetById(id)
async handleRemove(id) → async handleDelete(id)
```

### 2. Helper Methods (Non-HTTP)

**Decision:** Methods NOT directly called from routes can skip `handle` prefix

```typescript
// ✅ ACCEPTABLE (Helper methods for other services)
async getListAll(): Promise<Dto[]>          // For other services needing full list
async getRelationMap(): Promise<RelationMap> // For JOIN simulation
async getById(id): Promise<Dto | undefined>  // For internal use

// ❌ IF called from routes → Must use handleX
```

---

## 📋 Changes Required

### Change 1: `handleDetail` → `handleGetById`

**Affected Files:**

- `src/modules/iam/role/role.service.ts`
- `src/modules/location/location.service.ts`

**Occurrences:** 2

**Pattern:**

```typescript
// Before
async handleDetail(id: number): Promise<RoleDto> {
  return record('RoleService.handleDetail', async () => {
    const result = await this.getById(id)
    if (!result) throw RoleError.notFound(id)
    return result
  })
}

// After
async handleGetById(id: number): Promise<RoleDto> {
  return record('RoleService.handleGetById', async () => {
    const result = await this.getById(id)
    if (!result) throw RoleError.notFound(id)
    return result
  })
}
```

---

### Change 2: `handleRemove` → `handleDelete`

**Affected Files:**

- `src/modules/iam/role/role.service.ts`
- `src/modules/iam/user/user.service.ts`
- `src/modules/location/location.service.ts`

**Occurrences:** 3

**Pattern:**

```typescript
// Before
async handleRemove(id: number): Promise<EntityRef> {
  return record('RoleService.handleRemove', async () => {
    // ... delete logic
  })
}

// After
async handleDelete(id: number): Promise<EntityRef> {
  return record('RoleService.handleDelete', async () => {
    // ... delete logic
  })
}
```

---

### Change 3: Route Updates

**All routes that call renamed methods must be updated:**

**iam/role/role.route.ts:**

```typescript
// Before
.get('/:id', async ({ params }) => {
  return await roleService.handleDetail(params.id)
})
.delete('/:id', async ({ params }) => {
  return await roleService.handleRemove(params.id)
})

// After
.get('/:id', async ({ params }) => {
  return await roleService.handleGetById(params.id)
})
.delete('/:id', async ({ params }) => {
  return await roleService.handleDelete(params.id)
})
```

---

### Change 4: Helper Methods Review

**Decision on non-handle methods:**

```typescript
// KEEP AS-IS (Helper methods, not HTTP-facing)
async getListAll(): Promise<Dto[]>
  → Used by other services for batch operations
  → Not called directly from routes
  → Valid pattern for internal use

async getRelationMap(): Promise<RelationMap>
  → Used by other services for JOIN simulation
  → Not called directly from routes
  → Valid helper pattern

async getById(id): Promise<Dto | undefined>
  → Internal helper for caching layer
  → Not exposed via routes
  → Valid pattern
```

**Rationale:**

- Only HTTP-facing methods need `handleX` prefix
- Helper methods for service-to-service communication can use simpler names
- Reduces verbosity for internal APIs

---

## 🔄 Migration Strategy

### Step 1: Update Service Methods

1. Rename `handleDetail` → `handleGetById` (2 files)
2. Rename `handleRemove` → `handleDelete` (3 files)
3. Update OTEL trace names in `record()` calls

### Step 2: Update Route Files

1. Update `iam/role/role.route.ts` (2 call sites)
2. Update `iam/user/user.route.ts` (1 call site)
3. Update `location/location.route.ts` (2 call sites)

### Step 3: Update Tests (if any)

1. Search for test files calling old methods
2. Update test assertions

### Step 4: Verify

1. Type check passes
2. Lint passes
3. Tests pass (if any)

---

## 📊 Impact Analysis

### Breaking Changes

**None** - These are internal method renames, not public API changes

### Files Affected

- **Services:** 3 files (role, user, location)
- **Routes:** 3 files (role, user, location)
- **Total:** 6 files, ~10 call sites

### Risk Level

**Low** - Compile-time safe (TypeScript will catch all usages)

---

## ✅ Validation Checklist

After changes:

- [ ] All services use `handleGetById` (not `handleDetail`)
- [ ] All services use `handleDelete` (not `handleRemove`)
- [ ] All routes updated to call new method names
- [ ] OTEL trace names updated
- [ ] Type checking passes
- [ ] No references to old method names remain

---

## 🎯 Final Standard

### Public HTTP-Facing Methods (Must use `handleX`)

```typescript
// CRUD Operations
handleCreate(dto, actor): Promise<EntityRef>
handleUpdate(dto, actor): Promise<EntityRef>
handleGetById(id): Promise<Dto>           // ← Standardized
handleDelete(id, actor): Promise<EntityRef>  // ← Standardized
handleList(filter): Promise<WithPaginationResult<Dto>>

// Special Operations (business-specific)
handleChangePassword(id, dto, actor): Promise<EntityRef>
handleAdminUpdatePassword(dto, actor): Promise<EntityRef>
```

### Helper Methods (Internal use, no `handle`)

```typescript
// Used by other services
getListAll(): Promise<Dto[]>
getRelationMap(): Promise<RelationMap<K, Dto>>

// Internal helpers
getById(id): Promise<Dto | undefined>
getByIds(ids): Promise<Dto[]>
toRelationMap(items): RelationMap<K, Dto>
```

---

**Status:** Ready for implementation  
**Estimated Time:** 30-45 minutes  
**Risk:** Low (compile-time safe)
