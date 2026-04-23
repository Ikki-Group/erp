# IAM Refactoring - Before & After Comparison

## Problem: Scattered Error Definitions

### ❌ BEFORE
```typescript
// user.service.ts
const err = {
  notFound: (id: number) => new NotFoundError(`User with ID ${id} not found`, 'USER_NOT_FOUND'),
  createFailed: () => new InternalServerError('User creation failed', 'USER_CREATE_FAILED'),
  oldPasswordMismatch: () =>
    new BadRequestError('Old password does not match', 'USER_OLD_PASSWORD_MISMATCH'),
}

// assignment.service.ts
// Different error handling pattern

// role.service.ts
const err = {
  notFound: (id: number) => new NotFoundError(`Role with ID ${id} not found`, 'ROLE_NOT_FOUND'),
  createFailed: () => new InternalServerError('Role creation failed', 'ROLE_CREATE_FAILED'),
  // ... duplicated patterns
}

// Usage scattered everywhere
if (!user) throw err.notFound(id)
```

**Issues:**
- ❌ Error definitions duplicated across services
- ❌ Inconsistent error creation patterns
- ❌ Hard to find all error types
- ❌ Difficult to refactor error codes

### ✅ AFTER
```typescript
// iam/errors.ts (single file)
export class UserNotFoundError extends NotFoundError {
  constructor(id: number) {
    super(`User with ID ${id} not found`, 'USER_NOT_FOUND')
  }
}

export class UserConflictError extends ConflictError {
  constructor(field: 'email' | 'username') {
    const messages = { email: 'Email already exists', username: 'Username already exists' }
    super(messages[field], `USER_${field.toUpperCase()}_EXISTS`)
  }
}

// Usage everywhere
import { UserNotFoundError, UserConflictError } from '../errors'
if (!user) throw new UserNotFoundError(id)
```

**Benefits:**
- ✅ Single source of truth
- ✅ Consistent error patterns
- ✅ Easy to discover all error types (one file!)
- ✅ Type-safe with TypeScript
- ✅ Self-documenting error creation

---

## Problem: Magic Numbers & Hardcoded Strings

### ❌ BEFORE
```typescript
// assignment.service.ts
const SUPERADMIN_ROLE_ID = 1
const PLACEHOLDER_ID = 999999

getDefaultAssignmentForSuperadmin(): dto.UserAssignmentDto {
  const now = new Date()
  return {
    id: PLACEHOLDER_ID,
    userId: PLACEHOLDER_ID,
    roleId: SUPERADMIN_ROLE_ID,  // Where did these come from?
    locationId: PLACEHOLDER_ID,
    // ...
  }
}

// user.service.ts
const cache = bento.namespace('user')
// How do I know what the cache keys are? 🤔

// Multiple files with different cache strategies
```

**Issues:**
- ❌ Magic numbers scattered in code
- ❌ No clear naming convention for cache keys
- ❌ Hard to understand why values exist
- ❌ Impossible to change without searching everywhere

### ✅ AFTER
```typescript
// iam/constants.ts (single file)
export const SYSTEM_ROLES = {
  SUPERADMIN_ID: 1,  // Clear: system role ID
}

export const IAM_CONFIG = {
  SUPERADMIN_PLACEHOLDER_ID: 999999,  // Clear: used for dynamic assignments
}

export const IAM_CACHE_KEYS = {
  USER_LIST: 'iam:user:list',
  USER_DETAIL: (id: number) => `iam:user:${id}`,
  ROLE_LIST: 'iam:role:list',
}

// assignment.service.ts
import { SYSTEM_ROLES, IAM_CONFIG } from '../constants'

getDefaultAssignmentForSuperadmin(): dto.UserAssignmentDto {
  const now = new Date()
  return {
    id: IAM_CONFIG.SUPERADMIN_PLACEHOLDER_ID,
    roleId: SYSTEM_ROLES.SUPERADMIN_ID,
    // ... clear intent!
  }
}

// user.service.ts
import { IAM_CACHE_KEYS } from '../constants'
const cache = bento.namespace('user')
await cache.deleteMany({ keys: [IAM_CACHE_KEYS.USER_LIST] })
```

**Benefits:**
- ✅ All constants in one place
- ✅ Clear naming convention
- ✅ Easy to change (find & replace)
- ✅ Self-documenting
- ✅ Consistent across modules

---

## Problem: Validation Logic Mixed with Service Logic

### ❌ BEFORE
```typescript
// user.service.ts
async handleCreate(data: dto.UserCreateDto, actorId: number): Promise<{ id: number }> {
  await core.checkConflict({
    table: usersTable,
    pkColumn: usersTable.id,
    fields: uniqueFields,  // Defined at top of file 🤷
    input: data,
  })

  // ... rest of logic

  const insertedId = await this.repo.create({ ...data, passwordHash }, actorId)
}

async handleUpdate(id: number, data: dto.UserUpdateDto, actorId: number) {
  await core.checkConflict({
    table: usersTable,
    pkColumn: usersTable.id,
    fields: uniqueFields,
    input: { ...data },
    existing,
  })
  // ... similar pattern repeated
}

// If validation rules change, where do you look? 🔍
```

**Issues:**
- ❌ Validation scattered in multiple handlers
- ❌ Hard to find all validation logic
- ❌ Difficult to test validation in isolation
- ❌ Coupling to core utilities

### ✅ AFTER
```typescript
// iam/validators.ts (single file)
export const UserValidator = {
  async checkCreateConflicts(data: dto.UserCreateDto): Promise<void> {
    const [emailExists, usernameExists] = await Promise.all([
      !(await this.validateEmailUniqueness(data.email)),
      !(await this.validateUsernameUniqueness(data.username)),
    ])

    if (emailExists) throw new UserConflictError('email')
    if (usernameExists) throw new UserConflictError('username')
  },

  async checkUpdateConflicts(id: number, data: Partial<...>) {
    // Similar logic but focused
  }
}

// user.service.ts
import { UserValidator } from '../validators'

async handleCreate(data: dto.UserCreateDto, actorId: number) {
  await UserValidator.checkCreateConflicts(data)
  // ... rest of logic
}

async handleUpdate(id: number, data: dto.UserUpdateDto, actorId: number) {
  await UserValidator.checkUpdateConflicts(id, data)
  // ... rest of logic
}
```

**Benefits:**
- ✅ All validation in one place
- ✅ Easy to understand validation rules
- ✅ Can test validators independently
- ✅ Reusable across services/routers
- ✅ Clear error handling

---

## Problem: Service Methods Hard to Understand

### ❌ BEFORE
```typescript
// user.service.ts - 300+ lines, mixed concerns
export class UserService {
  // Query methods mixed with command methods
  async getList()
  async getById()
  async handleList()        // What's different from getList?
  async handleDetail()      // What's different from getById?
  async handleCreate()
  async seed()
  async handleUpdate()
  async handleAdminUpdatePassword()
  async handleChangePassword()
  async handleRemove()
  
  // Where are the internal helpers? Scattered throughout

  // Private methods
  private async clearCache()
  private async getUserAssignments()
}

// User: "Which method should I call?" 🤔
```

**Issues:**
- ❌ Mixed query/command methods
- ❌ No clear organization
- ❌ Internal helpers lost in the code
- ❌ Hard to understand what each method does

### ✅ AFTER
```typescript
// user.service.ts - organized, clear intent
export class UserService {
  /* ========================================================================== */
  /*                              QUERY OPERATIONS                             */
  /* ========================================================================== */
  async getList(): Promise<UserDto[]>
  async getById(id: number): Promise<UserDto | undefined>
  async getUserDetail(id: number): Promise<UserDetailDto>
  async getByIdentifier(identifier: string)
  async count(): Promise<number>

  /* ========================================================================== */
  /*                              COMMAND OPERATIONS                           */
  /* ========================================================================== */
  async seed(data): Promise<void>
  async handleCreate(data, actorId): Promise<{ id: number }>
  async handleUpdate(id, data, actorId): Promise<{ id: number }>
  async handleAdminUpdatePassword(data, actorId): Promise<{ id: number }>
  async handleChangePassword(id, data, actorId): Promise<{ id: number }>
  async handleRemove(id): Promise<{ id: number }>

  /* ========================================================================== */
  /*                            HANDLER OPERATIONS                             */
  /* ========================================================================== */
  async handleList(filter): Promise<PaginatedResult>
  async handleDetail(id): Promise<UserDetailResolvedDto>

  /* ========================================================================== */
  /*                              INTERNAL                                     */
  /* ========================================================================== */
  private async clearCache(id?)
  private async getUserAssignments(...)
}

// User: "Query methods are up top, commands below, internal at the end" ✅
```

**Benefits:**
- ✅ Crystal clear organization
- ✅ Query vs Command immediately obvious
- ✅ Internal methods separated
- ✅ Easy to scroll and find what you need
- ✅ Scalable as the service grows

---

## Summary: Impact

| Aspect | Before | After |
|--------|--------|-------|
| **Error Discovery** | Search multiple files | Open `errors.ts` |
| **Constants** | Magic numbers everywhere | `constants.ts` |
| **Validation Logic** | Mixed in services | Isolated in `validators.ts` |
| **Method Organization** | Random order | QUERY → COMMAND → HANDLER → INTERNAL |
| **Cache Keys** | Hardcoded strings | Named constants |
| **Refactoring** | Search everywhere | Edit one file |
| **Onboarding Time** | "Where is X?" | "Check STANDARDS.md" |
| **Lines of Code** | Same | Same |
| **Performance** | Same | Same |
| **Scalability** | Decreases as code grows | Increases with code growth |

---

## Lesson Learned

✨ **You don't need to split services or create complex architectures to achieve scalability and maintainability.**

Simple organization + clear constants + focused validators = pragmatic scalability for solo developers.
