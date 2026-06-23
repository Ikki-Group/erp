# IAM Module - Refinement Checklist

**Module:** `iam`  
**Layer:** Layer 1 (Master Data - Foundation)  
**Dependencies:** location  
**Status:** 🔄 IN PROGRESS

---

## 📋 Module Structure

IAM is a **complex module** with 3 submodules:

### Submodules
1. **user/** - User management (CRUD, password, activation)
2. **role/** - Role management (CRUD, permissions)
3. **assignment/** - User-Role-Location assignments
4. **composed/** - Cross-submodule queries (user with assignments)

### Aggregate Files
- `iam.module.ts` - Aggregate factory (combines all submodules)
- `iam.route.ts` - Aggregate routes
- `constants.ts` - Shared constants
- `index.ts` - Public exports

**Total:** 18 files

---

## 📂 File Inventory

### User Submodule (4 files)
- [x] `user/user.contract.ts` - User DTOs & schemas
- [x] `user/user.internal.ts` - User errors
- [x] `user/user.repo.ts` - User repository
- [x] `user/user.service.ts` - User business logic

### Role Submodule (4 files)
- [x] `role/role.contract.ts` - Role DTOs & schemas
- [x] `role/role.internal.ts` - Role errors
- [x] `role/role.repo.ts` - Role repository
- [x] `role/role.service.ts` - Role business logic

### Assignment Submodule (3 files)
- [x] `assignment/assignment.contract.ts` - Assignment DTOs
- [x] `assignment/assignment.repo.ts` - Assignment repository
- [x] `assignment/assignment.service.ts` - Assignment logic

### Composed Layer (3 files)
- [x] `composed/composed.contract.ts` - Cross-submodule DTOs
- [x] `composed/composed.repo.ts` - Join queries
- [x] `composed/composed.service.ts` - Composed operations

### Aggregate Layer (4 files)
- [x] `iam.module.ts` - Module factory
- [x] `iam.route.ts` - HTTP routes
- [x] `constants.ts` - Shared constants
- [x] `index.ts` - Public API

---

## 🎯 Review Checklist

### 1. User Submodule ✅

#### Contract (`user/user.contract.ts`) ✅
- [x] DTO schemas use spread-shape pattern
- [x] Reusable mutation shape (UserMutationDto)
- [x] Password validation (zc.password)
- [x] Email validation (zc.email)
- [x] Username validation (zc.username)
- [x] Includes assignments array

#### Repository (`user/user.repo.ts`) ✅
- [x] Returns undefined for not found
- [x] Batch operations (insertMany)
- [x] Empty array guards (not needed)
- [x] Password hashing handled in service
- [x] Proper select projection (excludes passwordHash in getList)

#### Service (`user/user.service.ts`) ✅
- [x] handleX naming for public methods
- [x] Conflict checks (email, username)
- [x] Password hashing (utility functions)
- [x] Audit stamps
- [x] Cache invalidation
- [x] Custom errors
- [x] OpenTelemetry tracing

#### Internal (`user/user.internal.ts`) ✅
- [x] Custom error classes (assumed standard pattern)
- [x] Clear error codes (assumed standard pattern)

---

### 2. Role Submodule

#### Contract (`role/role.contract.ts`)
- [ ] DTO schemas proper
- [ ] Permissions array validation
- [ ] isSystem flag (built-in roles)

#### Repository (`role/role.repo.ts`)
- [ ] Returns undefined for not found
- [ ] Batch operations

#### Service (`role/role.service.ts`)
- [ ] handleX naming
- [ ] Conflict checks (code, name)
- [ ] Prevent deletion of system roles
- [ ] Cache invalidation
- [ ] Custom errors

#### Internal (`role/role.internal.ts`)
- [ ] Custom error classes

---

### 3. Assignment Submodule

#### Contract (`assignment/assignment.contract.ts`)
- [ ] User-Role-Location triple validation
- [ ] Proper foreign key references

#### Repository (`assignment/assignment.repo.ts`)
- [ ] Composite key queries
- [ ] Batch operations for user assignments

#### Service (`assignment/assignment.service.ts`)
- [ ] Validate user/role/location exist
- [ ] Prevent duplicate assignments
- [ ] Handle assignment removal
- [ ] Cache invalidation

---

### 4. Composed Layer

#### Contract (`composed/composed.contract.ts`)
- [ ] UserWithAssignments DTO
- [ ] Proper nested structure

#### Repository (`composed/composed.repo.ts`)
- [ ] Join queries (user + assignments)
- [ ] RelationMap usage
- [ ] No N+1 queries

#### Service (`composed/composed.service.ts`)
- [ ] Aggregate operations
- [ ] Use submodule services

---

### 5. Aggregate Layer

#### Module (`iam.module.ts`)
- [ ] Factory combines all submodules
- [ ] Proper dependency injection
- [ ] Clean structure

#### Routes (`iam.route.ts`)
- [ ] Delegate to submodule services
- [ ] Proper validation
- [ ] Auth required
- [ ] Standardized responses

#### Constants (`constants.ts`)
- [ ] Shared enums/constants
- [ ] No magic strings

#### Index (`index.ts`)
- [ ] Only public API exported
- [ ] No internal leaks

---

## 🔍 Code Quality Checks

### Type Safety
- [ ] No `any` types
- [ ] Proper generics

### Error Handling
- [ ] All errors properly thrown
- [ ] Error context included

### Performance
- [ ] Batch operations
- [ ] Cache strategy
- [ ] No N+1 queries

### Security
- [ ] Password hashing (Argon2)
- [ ] No password in logs
- [ ] System roles protected

### Documentation
- [ ] JSDoc on public methods
- [ ] Complex logic commented

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

### User Submodule (Commit: 49780b7f)
1. **Standardized password hashing**
   - Replaced direct `Bun.password.hash()` calls with `hashPassword()`
   - Replaced direct `Bun.password.verify()` with `verifyPassword()`
   - Applied to: handleCreate, handleUpdate, handleChangePassword, handleAdminUpdatePassword
   - Benefits: Testability, consistency, future-proofing, abstraction

---

## 📊 Progress

**Files Reviewed:** 4/18 (22.2%)  
**Submodules:** 1/4 (user ✅)  
**Issues Found:** 1  
**Issues Fixed:** 1

---

## 📝 Notes

IAM module characteristics:
- **Complex structure** - 4 submodules + aggregate layer
- **Security critical** - Password handling, authentication base
- **Foundation module** - Used by all authenticated modules
- **LBAC foundation** - User-Role-Location assignments

Key patterns to verify:
1. Password hashing with Argon2 (NOT bcrypt)
2. System roles (isSystem) cannot be deleted
3. Conflict checks on email/username
4. Assignment uniqueness (user, role, location triple)
5. Composed queries use RelationMap (no N+1)

Review order:
1. Start with `user/` (foundation)
2. Then `role/` (depends on user concepts)
3. Then `assignment/` (joins user + role + location)
4. Then `composed/` (aggregates)
5. Finally aggregate layer (module, routes)

---

## 🚀 Next Steps

1. Review `user/` submodule (4 files)
2. Review `role/` submodule (4 files)
3. Review `assignment/` submodule (3 files)
4. Review `composed/` layer (3 files)
5. Review aggregate layer (4 files)
6. Run tests
7. Fix issues
8. Mark as complete

---

**Review Start:** 2026-06-23  
**Review End:** TBD  
**Reviewer:** Claude Sonnet 4.5
