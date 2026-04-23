# IAM Module Architecture

## Dependency Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          ROUTER LAYER                            │
│  (user.route.ts, role.route.ts, assignment.route.ts)            │
│  - HTTP request handling                                         │
│  - Request/response validation                                   │
│  - Auth/permission checks                                        │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                             │
│  (user.service.ts, role.service.ts, assignment.service.ts)      │
│                                                                   │
│  Organized into 4 sections:                                      │
│  1️⃣  QUERY OPERATIONS (read, cacheable)                         │
│  2️⃣  COMMAND OPERATIONS (write, mutations)                      │
│  3️⃣  HANDLER OPERATIONS (complex orchestration)                 │
│  4️⃣  INTERNAL (private helpers)                                 │
│                                                                   │
│  Uses:                                                            │
│  - errors.ts    → throw UserNotFoundError(id)                    │
│  - constants.ts → IAM_CACHE_KEYS.USER_LIST                       │
│  - validators.ts → await UserValidator.checkCreateConflicts()    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
    ┌────────┐ ┌──────────┐ ┌────────────┐
    │ ERRORS │ │CONSTANTS │ │ VALIDATORS │
    └────────┘ └──────────┘ └────────────┘
    • User     • CACHE_    • UserValidator
      Error     KEYS       • RoleValidator
    • Role     • SYSTEM_   • Assignment
      Error     ROLES        Validator
    • Assign   • IAM_
      ment       CONFIG
      Error
         │
         └─────────┬─────────┐
                   ▼         ▼
             ┌──────────┐ ┌──────────┐
             │ DTO LAYER│ │REPO LAYER│
             └──────────┘ └──────────┘
             • UserDto   • UserRepo
             • RoleDto   • RoleRepo
             • Assignment• Assignment
               Dto         Repo
                   │
                   ▼
             ┌──────────────┐
             │  DATABASE    │
             │  (Drizzle)   │
             └──────────────┘
```

## Cross-Cutting Concerns

```
┌──────────────────────────────────────────────────────────────────┐
│  CACHING (bento namespace)                                       │
│  - Cache keys from constants.ts                                  │
│  - Cache invalidation in service clearCache()                    │
│  - TTL managed in IAM_CONFIG                                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  TELEMETRY (@elysiajs/opentelemetry)                             │
│  - record() wrapping each method                                 │
│  - Method names as spans for tracing                             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ERROR HANDLING (errors.ts)                                      │
│  - Typed error classes extend core errors                        │
│  - Custom codes and messages                                     │
│  - Router middleware converts to HTTP responses                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Create User

```
1. HTTP POST /user/create
   └─ Router validates body (UserCreateDto)

2. Router calls service.handleCreate(body, actorId)
   
3. Service: handleCreate()
   ├─ Validate: await UserValidator.checkCreateConflicts(data)
   │  └─ Throws UserConflictError if email/username exists
   ├─ Hash password: await Bun.password.hash(password)
   ├─ Create: const id = await repo.create({ ...data, passwordHash }, actorId)
   ├─ Error handling: if (!id) throw new UserCreateFailedError()
   ├─ Cache clear: await cache.deleteMany({ keys: [IAM_CACHE_KEYS.USER_LIST] })
   └─ Return: { id }

4. Router wraps response: res.ok(result)

5. HTTP 200 { success: true, data: { id: 123 } }
```

## Error Handling Flow

```
Scenario: Create user with duplicate email

1. Router: service.handleCreate(userData, actorId)

2. Service: handleCreate()
   └─ await UserValidator.checkCreateConflicts(userData)
      └─ !validateEmailUniqueness(userData.email)
         └─ throw new UserConflictError('email')
            └─ "Email already exists" + code "USER_EMAIL_EXISTS"

3. Elysia error handler catches exception
   └─ Converts UserConflictError (extends ConflictError)
      └─ HTTP 409 Conflict

4. Client receives:
   {
     success: false,
     error: {
       message: "Email already exists",
       code: "USER_EMAIL_EXISTS"
     }
   }
```

## Cache Key Strategy

```
Pattern: iam:{domain}:{operation}:{id?}

Examples:
├─ iam:user:list           (all users, paginated)
├─ iam:user:123            (specific user by ID)
├─ iam:user:count          (user count)
├─ iam:role:list           (all roles)
├─ iam:role:456            (specific role by ID)
├─ iam:role:count          (role count)
└─ iam:assignment:user:789 (assignments for user 789)

Benefits:
✅ Clear namespace separation (iam:*)
✅ Domain grouped (user, role, assignment)
✅ Operation type visible (list, count, id)
✅ Easy to invalidate by pattern
✅ No collisions with other modules
```

## Validator Pattern

```
UserValidator = {
  validateEmailUniqueness(email, excludeId?) → boolean
  validateUsernameUniqueness(username, excludeId?) → boolean
  checkCreateConflicts(data) → throws UserConflictError
  checkUpdateConflicts(id, data) → throws UserConflictError
  validateAssignment(userId, locationId, roleId) → boolean
}

Usage in Service:
await UserValidator.checkCreateConflicts(data)
  ↓
Checks email + username uniqueness in parallel
  ↓
Throws typed error if conflict detected
  ↓
Service error handling converts to HTTP response
```

## Service Method Organization

```
UserService
│
├─ QUERY OPERATIONS (read-only, cacheable)
│  ├─ getList() → UserDto[]
│  ├─ getById(id) → UserDto | undefined
│  ├─ getUserDetail(id) → UserDetailDto
│  ├─ getByIdentifier(username/email) → UserDto + passwordHash
│  └─ count() → number
│
├─ COMMAND OPERATIONS (write, mutations)
│  ├─ seed(data) → void
│  ├─ handleCreate(data, actorId) → { id }
│  ├─ handleUpdate(id, data, actorId) → { id }
│  ├─ handleAdminUpdatePassword(data, actorId) → { id }
│  ├─ handleChangePassword(id, data, actorId) → { id }
│  └─ handleRemove(id) → { id }
│
├─ HANDLER OPERATIONS (orchestration)
│  ├─ handleList(filter) → PaginatedResult<UserDetailDto>
│  └─ handleDetail(id) → UserDetailDto + AuditResolved
│
└─ INTERNAL (private helpers)
   ├─ clearCache(id?) → void
   └─ getUserAssignments(user, roleMapper?, locationMapper?) → UserAssignmentDetailDto[]
```

## Dependencies Between Services

```
UserService
├─ depends on → UserRepo
├─ depends on → UserAssignmentService
├─ depends on → RoleService
└─ depends on → LocationMasterService

RoleService
├─ depends on → RoleRepo
└─ (no other IAM dependencies)

UserAssignmentService
├─ depends on → UserAssignmentRepo
└─ (no other IAM dependencies)

Note: Services DO NOT have circular dependencies ✅
```

## Key Design Decisions

| Decision | Reason | Trade-off |
|----------|--------|-----------|
| Single `errors.ts` | Centralization, easy to maintain | No domain separation, but fine for IAM |
| Single `constants.ts` | All in one place, easy to reference | Grows as IAM grows, but scalable |
| Single `validators.ts` | Reusable validators across services | Can grow large, but well-organized |
| Not splitting Query/Command services | Solo developer efficiency | Less granular, but clear sections |
| Service method organization by section | Easy discovery without splitting | Requires discipline in organizing |
| Cache keys from constants | No magic strings, type-safe | One more file to maintain |

## Scalability Path

```
TODAY (Sample Implementation)
├─ 1 module (User) with new standards
└─ 3 new files (errors, constants, validators)

SOON (Apply Pattern)
├─ 3 modules (User, Role, Assignment) with new standards
└─ 9 files total (3 sets of 3 files)

LATER (Pattern Proven)
├─ All modules adopt same pattern
├─ New modules use this as template
├─ Consistent codebase organization
└─ Easy to navigate and maintain

FUTURE (If Needed)
├─ Split Query/Command services (if module becomes massive)
├─ Create separate validator files by domain (if validators > 200 lines)
├─ Extract more abstractions (measured, not premature)
└─ But pattern foundation remains solid
```

---

This architecture balances:
- **Clarity**: Easy to understand the flow
- **Maintainability**: Clear organization & naming
- **Scalability**: Can grow without major refactors
- **Pragmatism**: Not over-engineered for solo dev
