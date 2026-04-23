# IAM Module - New Standards Implementation

## Overview

This document describes the new pragmatic standards implemented for the IAM module. These standards balance scalability with simplicity for solo developer workflows.

## Architecture

### File Structure

```
iam/
├── constants.ts          # Centralized constants & cache keys
├── errors.ts            # Typed error definitions
├── validators.ts        # Business logic validators
├── dto/
│   ├── user.dto.ts      # User DTOs
│   ├── role.dto.ts      # Role DTOs
│   ├── assignment.dto.ts # Assignment DTOs
│   └── index.ts
├── repo/
│   ├── user.repo.ts
│   ├── role.repo.ts
│   ├── assignment.repo.ts
│   └── index.ts
├── service/
│   ├── user.service.ts
│   ├── role.service.ts
│   ├── assignment.service.ts
│   └── index.ts
├── router/
│   ├── user.route.ts
│   ├── role.route.ts
│   ├── assignment.route.ts
│   └── index.ts
└── index.ts
```

## Key Standards

### 1. Centralized Errors (`errors.ts`)

All domain-specific errors are defined in a single file with typed error classes.

```typescript
// iam/errors.ts
export class UserNotFoundError extends NotFoundError {
  constructor(id: number) {
    super(`User with ID ${id} not found`, 'USER_NOT_FOUND')
  }
}

export class UserConflictError extends ConflictError {
  constructor(field: 'email' | 'username') {
    // Auto-generate message & code based on field
  }
}
```

**Usage in services:**

```typescript
import { UserNotFoundError, UserConflictError } from '../errors'

if (!user) throw new UserNotFoundError(id)
```

**Benefits:**
- ✅ Single source of truth for error definitions
- ✅ Type-safe error handling
- ✅ Easy to maintain and update
- ✅ Consistent error codes & messages

### 2. Unified Constants (`constants.ts`)

Cache keys, system IDs, and configuration are centralized.

```typescript
// iam/constants.ts
export const IAM_CACHE_KEYS = {
  USER_LIST: 'iam:user:list',
  USER_DETAIL: (id: number) => `iam:user:${id}`,
  // ...
}

export const SYSTEM_ROLES = {
  SUPERADMIN_ID: 1,
}
```

**Usage in services:**

```typescript
import { IAM_CACHE_KEYS, SYSTEM_ROLES } from '../constants'

await cache.deleteMany({ keys: [IAM_CACHE_KEYS.USER_LIST] })
```

**Benefits:**
- ✅ No magic numbers or hardcoded strings
- ✅ Easy to refactor (single change point)
- ✅ Self-documenting cache strategy
- ✅ Consistent naming conventions

### 3. Business Logic Validators (`validators.ts`)

Validation logic is separated from services for reusability.

```typescript
// iam/validators.ts
export const UserValidator = {
  async validateEmailUniqueness(email: string, excludeId?: number): Promise<boolean> {
    // Check database
  },

  async checkCreateConflicts(data: UserCreateDto): Promise<void> {
    // Throws UserConflictError if conflicts exist
  },
}
```

**Usage in services:**

```typescript
import { UserValidator } from '../validators'

async handleCreate(data: UserCreateDto, actorId: number) {
  await UserValidator.checkCreateConflicts(data)
  // ... rest of logic
}
```

**Benefits:**
- ✅ Validators can be reused across services/routers
- ✅ Easier to test validation logic in isolation
- ✅ Services stay focused on orchestration
- ✅ Clean separation of concerns

### 4. Organized Service Methods

Services are organized into three sections:

```typescript
export class UserService {
  // QUERY OPERATIONS (read-only, cacheable)
  async getList(): Promise<UserDto[]>
  async getById(id: number): Promise<UserDto | undefined>
  async getUserDetail(id: number): Promise<UserDetailDto>

  // COMMAND OPERATIONS (write operations)
  async handleCreate(data: UserCreateDto, actorId: number): Promise<{ id: number }>
  async handleUpdate(id: number, data: UserUpdateDto, actorId: number): Promise<{ id: number }>
  async handleRemove(id: number): Promise<{ id: number }>

  // HANDLER OPERATIONS (complex flows)
  async handleList(filter: UserFilterDto): Promise<PaginatedResult<UserDetailDto>>
  async handleDetail(id: number): Promise<UserDetailDetailDto>

  // INTERNAL (private helpers)
  private async clearCache(id?: number)
  private async getUserAssignments(...)
}
```

**Benefits:**
- ✅ Clear method organization
- ✅ Easy to understand intent (query vs command)
- ✅ Handlers can be discovered at a glance
- ✅ Scalable as the service grows

### 5. DTOs Stay Simple

DTOs remain organized in `dto/` directory without excessive splitting:

- `user.dto.ts` - all user-related DTOs
- `role.dto.ts` - all role-related DTOs
- `assignment.dto.ts` - all assignment-related DTOs

**Example:**

```typescript
// dto/user.dto.ts
export const UserDto = z.object({ ... })
export const UserDetailDto = z.object({ ... })
export const UserCreateDto = z.object({ ... })
export const UserUpdateDto = z.object({ ... })
export const UserFilterDto = z.object({ ... })
```

**Benefits:**
- ✅ Simple to navigate
- ✅ All user DTOs in one place
- ✅ Not over-engineered
- ✅ Easy to maintain

## Migration Guide for Other Modules

### Step 1: Create `errors.ts`

Define all domain-specific error classes:

```typescript
export class YourEntityNotFoundError extends NotFoundError { ... }
export class YourEntityConflictError extends ConflictError { ... }
```

### Step 2: Create `constants.ts`

Extract magic numbers and hardcoded strings:

```typescript
export const YOUR_CACHE_KEYS = { ... }
export const YOUR_CONFIG = { ... }
```

### Step 3: Create `validators.ts` (if needed)

Move validation logic from services:

```typescript
export const YourValidator = {
  async checkConflicts(data: YourCreateDto): Promise<void> { ... }
}
```

### Step 4: Refactor Services

- Organize methods by QUERY/COMMAND/HANDLER/INTERNAL
- Use errors from `errors.ts`
- Use constants from `constants.ts`
- Call validators from `validators.ts`

### Step 5: Update Router (if needed)

Use new error types in error handling middleware.

## Testing the Sample

Run linting:

```bash
bun run lint apps/server/src/modules/iam
```

Expected output: "Found 0 warnings and 0 errors."

## Next Steps

After validating this User module sample:

1. Apply same pattern to **Role module**
2. Apply same pattern to **Assignment module**
3. Document patterns for team consistency
4. Use as template for new modules

## FAQ

**Q: Why not split Query/Command into separate services?**
A: For solo developer efficiency. One service is easier to manage, and the QUERY/COMMAND sections clearly separate concerns.

**Q: Can I add more validators later?**
A: Yes! The `validators.ts` file is designed to grow. Add new validator objects as needed.

**Q: What if DTOs get complex?**
A: You can split them into separate files later (e.g., `dto/user.entity.ts`, `dto/user.mutation.ts`), but for now, keep it simple.

**Q: How do I use these in routers?**
A: Routers remain unchanged. They still call service methods and handle responses the same way.
