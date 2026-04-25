# 🏛️ Server Architecture Documentation

**Last Updated:** 2026-04-24  
**Status:** Production-Ready (Gold Standard)  
**Audience:** Developers, AI Agents, Code Reviewers

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Module Layering](#module-layering)
3. [Core Architecture Patterns](#core-architecture-patterns)
4. [Database Layer](#database-layer)
5. [Service Layer](#service-layer)
6. [Repository Layer](#repository-layer)
7. [HTTP & Router Layer](#http--router-layer)
8. [Error Handling](#error-handling)
9. [Validation Strategy](#validation-strategy)
10. [Caching Strategy](#caching-strategy)
11. [Type Safety](#type-safety)
12. [Performance Patterns](#performance-patterns)
13. [Authentication & Authorization](#authentication--authorization)
14. [Telemetry & Observability](#telemetry--observability)
15. [Dependency Injection](#dependency-injection)
16. [Feature Development Workflow](#feature-development-workflow)

---

## Overview

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Bun | Fast JavaScript runtime with native TypeScript support |
| **Web Framework** | Elysia | Type-safe REST API framework |
| **Database** | PostgreSQL | Relational data storage |
| **ORM** | Drizzle | Type-safe query builder |
| **Validation** | Zod | Runtime type validation |
| **Caching** | BentoCache | In-memory distributed cache |
| **Logging** | Pino | High-performance JSON logging |
| **Monitoring** | OpenTelemetry | Observability and tracing |
| **Testing** | Bun:test | Built-in test runner |

### Design Philosophy

The server architecture follows these core principles:

- **Type Safety First**: Strict TypeScript with Zod validation at boundaries
- **Composition Over Inheritance**: Prefer composition patterns and utilities
- **Clear Separation of Concerns**: Distinct layers (Router → Service → Repo)
- **DRY (Don't Repeat Yourself)**: Reusable utilities and patterns
- **Performance-Conscious**: Batch operations, caching, parallel queries
- **Safe by Default**: Errors thrown explicitly, proper HTTP status codes
- **Auditable**: Track who created/updated what and when
- **Testable**: Dependency injection enables easy mocking

---

## Module Layering

### Dependency Graph

```
Layer 3 (Aggregators)
├── production (depends on: recipe, inventory, location, iam)
├── hr (depends on: employee, location, iam)
├── dashboard (depends on: all layers)
├── moka (depends on: sales, product, location)
└── tool (depends on: all layers)
          ↓ (imports allowed only downward)
Layer 2 (Operations)
├── inventory (depends on: product, location, iam)
├── recipe (depends on: product, location, iam)
├── sales (depends on: product, location, iam)
├── purchasing (depends on: supplier, product, location, iam)
└── ...
          ↓ (imports allowed only downward)
Layer 1.5 (Security)
├── auth (depends on: iam)
          ↓ (imports allowed only downward)
Layer 1 (Master Data)
├── iam (depends on: location)
├── material (depends on: location)
├── supplier (depends on: location)
├── employee (depends on: location)
├── finance (depends on: location)
└── ...
          ↓ (imports allowed only downward)
Layer 0 (Core)
├── location (no dependencies)
├── product (no dependencies)
└── ...
```

### Layering Rules

1. **Unidirectional Imports**: Layer N can only import from Layer N-1, N-2, etc. (not upward)
2. **No Circular Dependencies**: Verified with `bun run check-deps`
3. **Shared Kernel**: `src/core/` is available to all layers (not counted as a layer)
4. **Type Exports Only**: When importing types between layers, ensure no runtime circular dependencies

### Module Structure

Each module follows this standard structure:

```
src/modules/{moduleName}/
├── dto/                      # Data Transfer Objects (validation schemas)
│   ├── index.ts             # Re-exports all DTOs
│   ├── {entity}.dto.ts      # Entity-specific schemas
│   └── constants.ts         # Module constants
├── repo/                     # Repository Layer (Database)
│   ├── index.ts             # Re-exports
│   └── {entity}.repo.ts     # Drizzle queries organized in methods
├── service/                  # Service Layer (Business Logic)
│   ├── index.ts             # Re-exports
│   └── {entity}.service.ts  # Business logic, caching, auditing
├── router/                   # Router Layer (HTTP Handlers)
│   ├── index.ts             # Re-exports
│   └── {entity}.route.ts    # Elysia route handlers
├── index.ts                 # Module public API export
└── constants.ts             # Module-level constants
```

---

## Core Architecture Patterns

### 1. Layered Architecture (Golden Path 2.1)

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Client / Frontend                   │
└─────────────────────────────────────────────────────────────┘
                              ↑ ↓
┌─────────────────────────────────────────────────────────────┐
│                   Router (HTTP Handlers)                     │
│  • Receives requests                                         │
│  • Validates input (Zod)                                    │
│  • Checks authentication                                    │
│  • Calls service methods                                    │
│  • Formats responses                                        │
└─────────────────────────────────────────────────────────────┘
                              ↑ ↓
┌─────────────────────────────────────────────────────────────┐
│               Service (Business Logic Layer)                 │
│  • Implements business rules                                │
│  • Orchestrates DB operations                               │
│  • Manages caching                                          │
│  • Records audit trails                                     │
│  • Throws domain errors                                     │
│  • DI: Instantiates repos in constructor                    │
└─────────────────────────────────────────────────────────────┘
                              ↑ ↓
┌─────────────────────────────────────────────────────────────┐
│              Repository (Data Access Layer)                  │
│  • Builds Drizzle queries                                   │
│  • Manages transactions                                     │
│  • Records telemetry                                        │
│  • Returns typed data                                       │
│  • No business logic                                        │
└─────────────────────────────────────────────────────────────┘
                              ↑ ↓
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Request Flow Example

```typescript
// 1. HTTP Request arrives at Router
POST /api/users/create
{
  "username": "john.doe",
  "email": "john@example.com"
}

// 2. Router Layer
async function create({ body, auth }) {
  // Validates body against UserCreateDto schema
  // Checks auth: true guard (user authenticated)
  // Calls service
  const result = await userService.handleCreate(body, auth.userId)
  return res.created(result)
}

// 3. Service Layer
async handleCreate(data, actorId) {
  // Check uniqueness conflicts
  await checkConflict({
    table: usersTable,
    fields: ['username', 'email'],
    input: { username: data.username, email: data.email }
  })
  
  // Call repo for DB insert
  const result = await this.repo.create({
    ...data,
    createdBy: actorId,
    createdAt: new Date()
  })
  
  // Invalidate cache
  await cache.delete(USER_CACHE_KEY.LIST)
  
  return result
}

// 4. Repository Layer
async create(data) {
  return record('UserRepo.create', async () => {
    return db.insert(usersTable).values(data)
  })
}

// 5. HTTP Response
{
  "success": true,
  "code": "CREATED",
  "data": { "id": 123, "username": "john.doe", ... }
}
```

---

## Database Layer

### Schema Design Principles

```typescript
// src/db/schema.ts follows these patterns:

// 1. Serial Integer IDs (not UUIDs)
export const usersTable = pgTable('users', {
  id: serial().primaryKey(),
  // ...
})

// 2. Standard Audit Columns
export const usersTable = pgTable('users', {
  id: serial().primaryKey(),
  // ... entity fields ...
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  createdBy: integer().references(() => usersTable.id).notNull(),
  updatedBy: integer().references(() => usersTable.id).notNull(),
})

// 3. Foreign Key References with Actions
export const assignmentsTable = pgTable('user_assignments', {
  id: serial().primaryKey(),
  userId: integer()
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .notNull(),
  locationId: integer()
    .references(() => locationsTable.id, { onDelete: 'cascade' })
    .notNull(),
  // ...
})

// 4. Constraints for Data Integrity
export const assignmentsTable = pgTable(
  'user_assignments',
  { ... },
  (table) => ({
    uniqueUserLocation: uniqueIndex().on(table.userId, table.locationId),
  })
)
```

### Migrations

```bash
# 1. Modify schema in src/db/schema.ts
# 2. Generate migration
bun run db:generate

# 3. Review generated migration file (src/db/migrations/*.sql)
# 4. Apply migration
bun run db:migrate

# 5. Commit both schema.ts and migration file
```

### Query Patterns

#### Single Record Query

```typescript
// ❌ BAD: Returns null if not found
const user = await db.select().from(usersTable).where(eq(usersTable.id, id))
if (!user) return null

// ✅ GOOD: Throws error explicitly
const user = await db.select().from(usersTable).where(eq(usersTable.id, id))
if (!user) throw new NotFoundError('User', id)
return user
```

#### Batch Query

```typescript
// ❌ BAD: N queries (N+1 problem)
const userIds = [1, 2, 3]
const users = []
for (const id of userIds) {
  users.push(await db.select().from(usersTable).where(eq(usersTable.id, id)))
}

// ✅ GOOD: Single query with inArray()
const userIds = [1, 2, 3]
const users = await db
  .select()
  .from(usersTable)
  .where(inArray(usersTable.id, userIds))
```

#### Paginated Query with Parallel Count

```typescript
// ✅ GOOD: Data + count execute in parallel
const result = await paginate({
  data: ({ limit, offset }) =>
    db
      .select()
      .from(usersTable)
      .limit(limit)
      .offset(offset),
  pq: { page: 1, limit: 20 },
  countQuery: db.select({ count: count() }).from(usersTable),
})
// Result: { data: [...], meta: { total, page, limit, pages } }
```

#### Search Filter

```typescript
// ✅ GOOD: Safe search that handles empty input
const where = searchFilter(usersTable.email, search)
// Returns: undefined if search is empty or whitespace
// Returns: ilike condition if search has value
// Usage: .where(where) safely ignores undefined
```

#### Relationship Join

```typescript
// ❌ BAD: N+1 queries (separate DB calls for each join)
const users = await db.select().from(usersTable)
const rolesById = new Map()
for (const user of users) {
  const role = await db.select().from(rolesTable).where(eq(rolesTable.id, user.roleId))
  rolesById.set(user.id, role)
}

// ✅ GOOD: In-memory join using RelationMap
const users = await db.select().from(usersTable)
const roles = await db.select().from(rolesTable)
const roleMap = new RelationMap(roles, r => r.id)
const usersWithRoles = users.map(u => ({
  ...u,
  role: roleMap.getRequired(u.roleId, `Role ${u.roleId} not found`)
}))
```

#### Transaction

```typescript
// ✅ GOOD: Multiple operations in single transaction
await db.transaction(async (tx) => {
  // All queries use tx instead of db
  // If any fails, all rollback
  await tx.delete(assignmentsTable).where(eq(assignmentsTable.userId, userId))
  await tx.insert(assignmentsTable).values(newAssignments)
})
```

### Conflict Checking

The `checkConflict()` utility validates uniqueness constraints:

```typescript
// ✅ CREATE: Check all fields for duplicates
await checkConflict({
  table: usersTable,
  fields: [
    { column: usersTable.email, code: 'EMAIL_EXISTS' },
    { column: usersTable.username, code: 'USERNAME_EXISTS' },
  ],
  input: { email: data.email, username: data.username }
})

// ✅ UPDATE: Check only changed fields, exclude self
await checkConflict({
  table: usersTable,
  fields: [{ column: usersTable.email, code: 'EMAIL_EXISTS' }],
  input: { email: data.email },
  existing: existingUser // Excludes this record from check
})
```

---

## Service Layer

### Service Class Pattern

```typescript
export class UserService {
  // Constructor: Dependency Injection of Repository
  constructor(public repo = new UserRepo()) {}

  /* ========================================================================== */
  /*                              QUERY OPERATIONS                             */
  /* ========================================================================== */

  async handleList(filter: UserFilterDto) {
    return record('UserService.handleList', async () => {
      return this.repo.getList(filter)
    })
  }

  async handleDetail(id: number) {
    return record('UserService.handleDetail', async () => {
      const cached = await cache.get(USER_CACHE_KEYS.DETAIL(id))
      if (cached) return cached

      const user = await this.repo.getById(id)
      if (!user) throw new NotFoundError('User', id)

      await cache.set(USER_CACHE_KEYS.DETAIL(id), user)
      return user
    })
  }

  /* ========================================================================== */
  /*                              COMMAND OPERATIONS                           */
  /* ========================================================================== */

  async handleCreate(data: UserCreateDto, actorId: number) {
    return record('UserService.handleCreate', async () => {
      // 1. Validate uniqueness
      await checkConflict({
        table: usersTable,
        fields: [
          { column: usersTable.email, code: 'EMAIL_EXISTS' },
          { column: usersTable.username, code: 'USERNAME_EXISTS' },
        ],
        input: { email: data.email, username: data.username }
      })

      // 2. Create record
      const user = await this.repo.create({
        ...data,
        createdBy: actorId,
        updatedBy: actorId,
      })

      // 3. Invalidate caches
      await this.invalidateLists()

      return user
    })
  }

  async handleUpdate(id: number, data: UserUpdateDto, actorId: number) {
    return record('UserService.handleUpdate', async () => {
      // 1. Get existing to validate and exclude from conflict check
      const existing = await this.repo.getById(id)
      if (!existing) throw new NotFoundError('User', id)

      // 2. Validate uniqueness (excluding self)
      const fieldsToCheck = Object.entries(data)
        .filter(([key]) => ['email', 'username'].includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

      if (Object.keys(fieldsToCheck).length > 0) {
        await checkConflict({
          table: usersTable,
          fields: [
            { column: usersTable.email, code: 'EMAIL_EXISTS' },
            { column: usersTable.username, code: 'USERNAME_EXISTS' },
          ],
          input: fieldsToCheck,
          existing // Excludes this record from check
        })
      }

      // 3. Update record
      const updated = await this.repo.update(id, {
        ...data,
        updatedBy: actorId,
      })

      // 4. Invalidate caches
      await this.invalidateLists()
      await cache.delete(USER_CACHE_KEYS.DETAIL(id))

      return updated
    })
  }

  async handleDelete(id: number) {
    return record('UserService.handleDelete', async () => {
      const existing = await this.repo.getById(id)
      if (!existing) throw new NotFoundError('User', id)

      await this.repo.delete(id)

      // Invalidate caches
      await this.invalidateLists()
      await cache.delete(USER_CACHE_KEYS.DETAIL(id))
    })
  }

  /* ========================================================================== */
  /*                              INTERNAL HELPERS                             */
  /* ========================================================================== */

  private async invalidateLists() {
    await cache.delete(USER_CACHE_KEYS.LIST)
  }
}
```

### Method Naming Convention

- **Public Methods** (called from Router): `handleX` prefix
  - `handleList()`, `handleDetail()`, `handleCreate()`, `handleUpdate()`, `handleDelete()`
  - `handleBulkAssign()`, `handleBulkDelete()`
  
- **Private Methods** (internal): No prefix
  - `validateInput()`, `findById()`, `invalidateCaches()`

### Batch Operations Pattern

When processing multiple records:

```typescript
// ❌ BAD: Loop with individual DB calls (N queries)
async handleAssignUsersToLocation(userIds: number[], locationId: number, roleId: number, actorId: number) {
  for (const userId of userIds) {
    const assignments = await this.repo.getList({ userId })
    // ... build new assignments ...
    await this.repo.replaceBulkByUserId(userId, newAssignments, actorId)
  }
}

// ✅ GOOD: Single DB call for fetch + single DB call for write (2 queries)
async handleAssignUsersToLocation(userIds: number[], locationId: number, roleId: number, actorId: number) {
  // 1. Single query: get all assignments for all users
  const existingAssignments = await this.repo.getListByUserIds(userIds)

  // 2. Memory operations: build assignments for all users
  const assignmentsByUserId = new Map<number, UserAssignmentUpsertDto[]>()
  for (const userId of userIds) {
    const userAssignments = existingAssignments.filter((a) => a.userId === userId)
    // ... build new assignments ...
    assignmentsByUserId.set(userId, newAssignments)
  }

  // 3. Single transaction: delete all + insert all
  await this.repo.replaceBulkByUserIds(userIds, assignmentsByUserId, actorId)

  // 4. Invalidate caches for all affected users
  await this.invalidateUsersCaches(userIds)
}
```

Performance impact: **O(n) → O(2)** for N records

---

## Repository Layer

### Repository Class Pattern

```typescript
export class UserRepo {
  /* -------------------------------------------------------------------------- */
  /*                                    QUERY                                   */
  /* -------------------------------------------------------------------------- */

  async getList(filter: OmitPaginationQuery<UserFilterDto>) {
    return record('UserRepo.getList', async () => {
      const where = this.buildWhereClause(filter)
      return db.select().from(usersTable).where(where)
    })
  }

  async getListPaginated(filter: UserFilterDto) {
    return record('UserRepo.getListPaginated', async () => {
      const where = this.buildWhereClause(filter)
      return paginate({
        data: ({ limit, offset }) =>
          db.select().from(usersTable).where(where).limit(limit).offset(offset),
        pq: { page: filter.page, limit: filter.limit },
        countQuery: db.select({ count: count() }).from(usersTable).where(where),
      })
    })
  }

  async getById(id: number) {
    return record('UserRepo.getById', async () => {
      return db.select().from(usersTable).where(eq(usersTable.id, id)).then(r => r[0])
    })
  }

  async getByIds(ids: number[]) {
    return record('UserRepo.getByIds', async () => {
      return db.select().from(usersTable).where(inArray(usersTable.id, ids))
    })
  }

  /* -------------------------------------------------------------------------- */
  /*                                  MUTATION                                  */
  /* -------------------------------------------------------------------------- */

  async create(data: typeof usersTable.$inferInsert) {
    return record('UserRepo.create', async () => {
      return db.insert(usersTable).values(data).returning()
    })
  }

  async update(id: number, data: Partial<typeof usersTable.$inferInsert>) {
    return record('UserRepo.update', async () => {
      return db
        .update(usersTable)
        .set(data)
        .where(eq(usersTable.id, id))
        .returning()
    })
  }

  async delete(id: number) {
    return record('UserRepo.delete', async () => {
      await db.delete(usersTable).where(eq(usersTable.id, id))
    })
  }

  async bulkUpdate(ids: number[], data: Partial<typeof usersTable.$inferInsert>) {
    return record('UserRepo.bulkUpdate', async () => {
      await db.update(usersTable).set(data).where(inArray(usersTable.id, ids))
    })
  }

  async bulkDelete(ids: number[]) {
    return record('UserRepo.bulkDelete', async () => {
      await db.delete(usersTable).where(inArray(usersTable.id, ids))
    })
  }

  /* -------------------------------------------------------------------------- */
  /*                                  PRIVATE                                   */
  /* -------------------------------------------------------------------------- */

  private buildWhereClause(filter: Partial<UserFilterDto>) {
    const { search, roleId, locationId } = filter
    return and(
      search ? searchFilter(usersTable.email, search) : undefined,
      roleId ? eq(usersTable.roleId, roleId) : undefined,
      locationId ? eq(usersTable.locationId, locationId) : undefined,
    )
  }
}
```

### Key Principles

1. **QUERY Section**: Read operations (select)
2. **MUTATION Section**: Write operations (insert, update, delete)
3. **PRIVATE Section**: Helper methods like `buildWhereClause()`
4. **Telemetry**: Every method wrapped in `record()`
5. **No Business Logic**: Pure data access, no validation or caching
6. **Transactions**: Wrap multi-step mutations in `db.transaction()`
7. **Return Types**: Use Drizzle's `.returning()` to get inserted/updated records

---

## HTTP & Router Layer

### Router Handler Pattern

```typescript
import { Elysia, t } from 'elysia'
import { userService } from '@/modules/user'
import * as dto from '../dto'

export const userRouter = new Elysia({ prefix: '/users' })
  // ✅ List endpoint
  .get(
    '/list',
    async ({ query }) => {
      const result = await userService.handleList(query)
      return res.ok(result)
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
        search: t.Optional(t.String()),
      }),
    }
  )

  // ✅ Detail endpoint
  .get(
    '/:id',
    async ({ params }) => {
      const user = await userService.handleDetail(params.id)
      return res.ok(user)
    },
    {
      params: t.Object({ id: zId }),
    }
  )

  // ✅ Create endpoint
  .post(
    '/create',
    async ({ body, auth }) => {
      const user = await userService.handleCreate(body, auth.userId)
      return res.created(user)
    },
    {
      auth: true, // Require authentication
      body: dto.UserCreateDto,
    }
  )

  // ✅ Update endpoint
  .put(
    '/:id',
    async ({ params, body, auth }) => {
      const user = await userService.handleUpdate(params.id, body, auth.userId)
      return res.ok(user)
    },
    {
      auth: true,
      params: t.Object({ id: zId }),
      body: dto.UserUpdateDto,
    }
  )

  // ✅ Delete endpoint
  .delete(
    '/:id',
    async ({ params, auth }) => {
      await userService.handleDelete(params.id)
      return res.noContent()
    },
    {
      auth: true,
      params: t.Object({ id: zId }),
    }
  )

  // ✅ Bulk operation endpoint
  .post(
    '/bulk-assign',
    async ({ body, auth }) => {
      await userService.handleBulkAssign(body.userIds, body.locationId, body.roleId, auth.userId)
      return res.ok({ message: 'Assigned successfully' })
    },
    {
      auth: true,
      body: t.Object({
        userIds: t.Array(zId),
        locationId: zId,
        roleId: zId,
      }),
    }
  )
```

### Handler Naming Convention

- **List**: `GET /list` → `handleList()`
- **Detail**: `GET /:id` → `handleDetail()`
- **Create**: `POST /create` → `handleCreate()`
- **Update**: `PUT /:id` → `handleUpdate()`
- **Delete**: `DELETE /:id` → `handleDelete()`
- **Bulk Operations**: `POST /bulk-X` → `handleBulkX()`

### Response Builders

```typescript
import { res } from '@/core/http/response'

// Single object
res.ok(data)
// → { success: true, code: 'OK', data }

// List with pagination
res.paginated(result)
// → { success: true, code: 'OK', data: result.data, meta: { total, page, limit, pages } }

// Created (201)
res.created(data)
// → { success: true, code: 'CREATED', data }

// No content (204)
res.noContent()
// → undefined (Elysia handles 204 response)
```

### Authentication

```typescript
// Protected route
.post('/create', handler, {
  auth: true, // Requires valid JWT token
  body: dto.UserCreateDto,
})

// Handler receives authenticated user
async function create({ body, auth }) {
  // auth.userId: number (user ID from token)
  // auth.user: User object (optional, populated by auth plugin)
  // Pass auth.userId to service for audit trail
}

// Public route (optional: explicit auth: false)
.get('/public', handler, {
  // No auth: true means public endpoint
})
```

---

## Error Handling

### Error Hierarchy

```
HttpError (base class)
├── BadRequestError (400) - Validation failed
├── UnauthorizedError (401) - Missing/invalid auth
├── ForbiddenError (403) - Insufficient permission
├── NotFoundError (404) - Resource not found
├── ConflictError (409) - Uniqueness/state violation
└── InternalServerError (500) - Server-side error
```

### Error Throwing Pattern

```typescript
// ❌ BAD: Return null and let caller handle
const user = await repo.getById(id)
return user || null

// ✅ GOOD: Throw error, let framework handle
const user = await repo.getById(id)
if (!user) throw new NotFoundError('User', id)

// ❌ BAD: Return error object
if (email taken) return { error: 'EMAIL_EXISTS' }

// ✅ GOOD: Throw with code for programmatic handling
if (emailTaken) throw new ConflictError('Email already in use', 'EMAIL_EXISTS')

// Custom error with details
throw new ConflictError('Email already taken', 'EMAIL_EXISTS', {
  field: 'email',
  value: data.email,
})
```

### Error Response Format

All errors are automatically converted to this format:

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User #123 not found",
  "statusCode": 404,
  "details": {}
}
```

### Error Handler (Global)

Elysia error handler catches all thrown errors:

```typescript
// src/core/http/error-handler.ts
// Converts HttpError → HTTP response
// Returns 500 for unexpected errors
// Logs errors with context
```

---

## Validation Strategy

### DTO (Data Transfer Object) Pattern

```typescript
// src/modules/user/dto/user.dto.ts

import { z } from 'zod'
import { zId, zc, zq } from '@/core/validation'

// ✅ GOOD: Base DTO with audit fields
export const UserBaseDto = z.object({
  id: zId,
  username: z.string().min(3).max(50),
  email: zc.email(),
})

// ✅ GOOD: Spread-shape for composition (not .extend())
export const UserDto = z.object({
  ...UserBaseDto.shape,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: zId,
  updatedBy: zId,
})

// ✅ GOOD: Create DTO (omit ID and audit)
export const UserCreateDto = z.object({
  ...z.object({ username: z.string(), email: zc.email() }).shape,
})

// ✅ GOOD: Update DTO (all fields optional)
export const UserUpdateDto = z.object({
  username: z.string().optional(),
  email: zc.email().optional(),
})

// ✅ GOOD: Filter DTO with pagination
export const UserFilterDto = z.object({
  ...zq.pagination.shape,
  search: z.string().optional(),
  roleId: zId.optional(),
})

// Export types for use in service/router
export type User = z.infer<typeof UserDto>
export type UserCreate = z.infer<typeof UserCreateDto>
export type UserUpdate = z.infer<typeof UserUpdateDto>
```

### Validation at Boundaries

```typescript
// ✅ GOOD: Validate input in router
.post('/create', handler, {
  body: dto.UserCreateDto, // Elysia validates automatically
})

async function handler({ body }) {
  // body is guaranteed to match UserCreateDto type
  // No validation needed in service
}

// ❌ BAD: Duplicate validation in service
async handleCreate(data: any) {
  const validated = UserCreateDto.parse(data) // Unnecessary, already validated
}
```

### Core Validation Helpers

```typescript
// From @/core/validation

// zId - Safe integer ID validation
zId // z.number().int().positive()

// zc.email() - Email validation
zc.email() // z.string().email()

// zc.password() - Password validation (min 8 chars)
zc.password()

// zc.username() - Username validation (3-50 chars, alphanumeric)
zc.username()

// zq.pagination - Pagination query
zq.pagination // { page: z.number(), limit: z.number() }

// Composition
const MyDto = z.object({
  ...BaseDto.shape,
  ...zq.pagination.shape,
})
```

---

## Caching Strategy

### Cache Namespace Pattern

```typescript
// src/modules/user/service/user.service.ts

import { bento } from '@/core/cache'

const cache = bento.namespace('user')

export class UserService {
  // Read with cache
  async handleDetail(id: number) {
    return cache.getOrSet({
      key: USER_CACHE_KEYS.DETAIL(id),
      factory: async () => this.repo.getById(id),
      ttl: 3600, // 1 hour
    })
  }

  // Invalidate on write
  async handleUpdate(id: number, data: UserUpdateDto, actorId: number) {
    const updated = await this.repo.update(id, { ...data, updatedBy: actorId })
    
    // Invalidate affected caches
    await cache.delete(USER_CACHE_KEYS.DETAIL(id))
    await cache.delete(USER_CACHE_KEYS.LIST)
    
    return updated
  }
}
```

### Cache Key Constants

```typescript
// src/modules/user/constants.ts

export const USER_CACHE_KEYS = {
  LIST: 'user.list',
  DETAIL: (id: number) => `user.detail.${id}`,
  BY_EMAIL: (email: string) => `user.email.${email}`,
}

// Usage
await cache.get(USER_CACHE_KEYS.DETAIL(userId))
await cache.delete(USER_CACHE_KEYS.DETAIL(userId))
```

### Cache Invalidation Rules

1. **List Cache**: Invalidate on any create/update/delete
2. **Detail Cache**: Invalidate when specific record changed
3. **Relationship Cache**: Invalidate when dependent data changes
4. **TTL**: Set based on data volatility (rarely changed: 1h+, frequently: 5-15m)

### BentoCache API

```typescript
const cache = bento.namespace('module')

// Get or compute
await cache.getOrSet({
  key: 'some.key',
  factory: async () => expensiveOperation(),
  ttl: 3600, // 1 hour
})

// Get
await cache.get('some.key')

// Set
await cache.set('some.key', value, 3600)

// Delete
await cache.delete('some.key')

// Batch delete
await cache.deleteMany({ keys: ['key1', 'key2'] })

// Clear namespace
await cache.clear()
```

---

## Type Safety

### TypeScript Configuration

- **Mode**: `strict: true`
- **No Escapes**: No `any` types (except documented exceptions)
- **Inference**: Preserve generic type inference

### Zod Patterns

#### ❌ Wrong: Using .extend() breaks inference

```typescript
const BaseDto = z.object({ id: zId })
const UserDto = BaseDto.extend({ name: z.string() })
// ❌ Type inference is lost, becomes generic object
```

#### ✅ Right: Using spread preserves inference

```typescript
const BaseDto = z.object({ id: zId })
const UserDto = z.object({
  ...BaseDto.shape,
  name: z.string(),
})
// ✅ Type inference preserved, proper generic types
```

### Type Extraction

```typescript
// From Zod schema
export const UserDto = z.object({ id: zId, name: z.string() })
export type User = z.infer<typeof UserDto>

// From Drizzle table
export const usersTable = pgTable('users', { ... })
export type User = typeof usersTable.$inferSelect
export type UserInsert = typeof usersTable.$inferInsert

// Function return type
async function getUser(id: number): Promise<User> {
  return this.repo.getById(id)
}
```

### Generic Patterns

```typescript
// ✅ GOOD: Generic utility with proper constraints
export function arrayToMap<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}

// Usage preserves type
const byUserId = arrayToMap(assignments, a => a.userId)
// byUserId: Map<number, Assignment[]>
```

---

## Performance Patterns

### N+1 Query Prevention

#### Pattern 1: Batch Load

```typescript
// ❌ BAD: N+1 queries
const users = await repo.getList()
for (const user of users) {
  user.role = await roleRepo.getById(user.roleId)
}

// ✅ GOOD: 2 queries total
const users = await repo.getList()
const roles = await roleRepo.getByIds(users.map(u => u.roleId))
const roleMap = new RelationMap(roles, r => r.id)
const usersWithRoles = users.map(u => ({
  ...u,
  role: roleMap.getRequired(u.roleId),
}))
```

#### Pattern 2: RelationMap

```typescript
import { RelationMap } from '@/core/utils'

// Load separate, join in memory
const users = await db.select().from(usersTable)
const roles = await db.select().from(rolesTable)

// Create join map
const roleMap = new RelationMap(roles, r => r.id)

// Safe lookup with type checking
const user = users[0]
const role = roleMap.getRequired(user.roleId, `Role ${user.roleId} not found`)

// Batch lookup
const userRoles = roleMap.getManyRequired(
  users.map(u => u.roleId),
  (id) => `Role ${id} not found`
)
```

#### Pattern 3: Parallel Queries

```typescript
// ✅ GOOD: Execute in parallel
const [data, count] = await Promise.all([
  db.select().from(usersTable).limit(20).offset(0),
  db.select({ count: count() }).from(usersTable),
])

// Used in paginate() automatically
const result = await paginate({
  data: ({ limit, offset }) => queryFn(),
  countQuery: countFn(),
  pq: { page: 1, limit: 20 },
})
```

### Query Optimization

```typescript
// ✅ GOOD: Select only needed columns
db.select({
  id: usersTable.id,
  email: usersTable.email,
  // Omit unused columns
}).from(usersTable)

// ✅ GOOD: Use WHERE before LIMIT
db.select()
  .from(usersTable)
  .where(eq(usersTable.roleId, roleId)) // Filter first
  .limit(20)

// ✅ GOOD: Index on frequently filtered columns
export const usersTable = pgTable('users', { ... }, (table) => ({
  roleIdIdx: index().on(table.roleId),
  emailIdx: uniqueIndex().on(table.email),
}))
```

### Caching Strategy

```typescript
// ✅ GOOD: Cache expensive operations
async handleList(filter: UserFilterDto) {
  if (!filter.search && !filter.roleId) {
    // No filters = cache the whole list
    return cache.getOrSet({
      key: USER_CACHE_KEYS.LIST,
      factory: () => this.repo.getList({}),
      ttl: 3600,
    })
  }
  // With filters = don't cache (or use different key)
  return this.repo.getList(filter)
}

// ✅ GOOD: Invalidate on mutations
async handleCreate(data, actorId) {
  const result = await this.repo.create({ ...data, createdBy: actorId })
  await cache.delete(USER_CACHE_KEYS.LIST) // Invalidate list
  return result
}
```

---

## Authentication & Authorization

### Auth Macro Plugin

```typescript
// src/core/http/auth-macro.ts

export class AuthContext {
  constructor(
    public userId: number,
    public user?: User // Optional populated user
  ) {}
}

// Usage in handlers
.post('/create', handler, { auth: true })

async function handler({ auth }) {
  // auth: AuthContext
  const userId = auth.userId
  // Pass to service for audit
  await service.handleCreate(data, auth.userId)
}
```

### JWT Token Flow

```
1. User logs in → /auth/login
2. Server validates credentials
3. Server returns JWT token
4. Client stores token (localStorage, cookie)
5. Client includes in Authorization header
6. Server validates token in auth macro
7. Attach auth context to handler
```

### Permission Checks

```typescript
// Option 1: In router (early exit)
.delete('/:id', handler, {
  auth: true,
  beforeHandle: async ({ auth, params }) => {
    const resource = await repo.getById(params.id)
    if (resource.createdBy !== auth.userId && !auth.user?.isAdmin) {
      throw new ForbiddenError('Not authorized to delete')
    }
  },
})

// Option 2: In service (business logic)
async handleDelete(id: number, actorId: number) {
  const existing = await repo.getById(id)
  if (existing.createdBy !== actorId && !isAdmin(actorId)) {
    throw new ForbiddenError('Not authorized to delete')
  }
  await repo.delete(id)
}
```

---

## Telemetry & Observability

### OpenTelemetry Recording

Every database operation is wrapped with `record()`:

```typescript
import { record } from '@elysiajs/opentelemetry'

// In Repository
async getById(id: number) {
  return record('UserRepo.getById', async () => {
    return db.select().from(usersTable).where(eq(usersTable.id, id))
  })
}

// In Service
async handleDetail(id: number) {
  return record('UserService.handleDetail', async () => {
    return cache.getOrSet({
      key: USER_CACHE_KEYS.DETAIL(id),
      factory: async () => this.repo.getById(id),
    })
  })
}
```

### Structured Logging

```typescript
import { logger } from '@/core/logger'

// Info
logger.info({ userId, action: 'login' }, 'User logged in')

// Warn
logger.warn({ attempt: 3 }, 'Multiple login attempts')

// Error
logger.error({ error, userId }, 'Failed to create user')
```

### Metrics (via OpenTelemetry)

- Request latency
- Database query duration
- Cache hit rate
- Error rate
- Business metrics (users created, etc.)

---

## Dependency Injection

### Service Registration

```typescript
// src/modules/_registry.ts

import { UserService } from './user/service'
import { LocationService } from './location/service'

export const userService = new UserService()
export const locationService = new LocationService()

// Modules with dependencies
export const iamService = new IAMService(locationService, userService)
```

### Constructor Injection

```typescript
export class IAMService {
  constructor(
    public locationRepo = new LocationRepo(),
    public locationService = locationService, // Can inject services too
  ) {}
}

// Usage (repos use constructor default)
const repo = new UserAssignmentRepo()
const service = new UserAssignmentService(repo)
```

### Benefits

- Easy mocking in tests
- Explicit dependencies
- No global state
- Flexible composition

---

## Feature Development Workflow

### Step 1: Define DTOs

```typescript
// src/modules/user/dto/user.dto.ts

export const UserCreateDto = z.object({
  username: z.string().min(3),
  email: zc.email(),
})

export const UserUpdateDto = z.object({
  username: z.string().optional(),
  email: zc.email().optional(),
})

export const UserFilterDto = z.object({
  ...zq.pagination.shape,
  search: z.string().optional(),
})
```

### Step 2: Create Repository

```typescript
// src/modules/user/repo/user.repo.ts

export class UserRepo {
  /* QUERY */
  async getList(filter: UserFilterDto) { ... }
  async getById(id: number) { ... }
  
  /* MUTATION */
  async create(data) { ... }
  async update(id, data) { ... }
  async delete(id) { ... }
  
  /* PRIVATE */
  private buildWhereClause(filter) { ... }
}
```

### Step 3: Create Service

```typescript
// src/modules/user/service/user.service.ts

const cache = bento.namespace('user')

export class UserService {
  constructor(public repo = new UserRepo()) {}
  
  /* QUERY */
  async handleList(filter: UserFilterDto) { ... }
  async handleDetail(id: number) { ... }
  
  /* COMMAND */
  async handleCreate(data: UserCreateDto, actorId: number) { ... }
  async handleUpdate(id: number, data: UserUpdateDto, actorId: number) { ... }
  async handleDelete(id: number) { ... }
  
  /* INTERNAL */
  private async invalidateCaches() { ... }
}
```

### Step 4: Create Router

```typescript
// src/modules/user/router/user.route.ts

export const userRouter = new Elysia({ prefix: '/users' })
  .get('/list', handler, { query: dto.UserFilterDto })
  .get('/:id', handler, { params: t.Object({ id: zId }) })
  .post('/create', handler, { auth: true, body: dto.UserCreateDto })
  .put('/:id', handler, { auth: true, body: dto.UserUpdateDto })
  .delete('/:id', handler, { auth: true })
```

### Step 5: Register Module

```typescript
// src/modules/_registry.ts
export const userService = new UserService()

// src/modules/_routes.ts
app.use(userRouter)
```

### Step 6: Write Tests

```typescript
// src/modules/user/service/user.service.test.ts

describe('UserService', () => {
  const mockRepo = {
    getById: async (id) => ({ id, username: 'test' }),
    create: async (data) => ({ id: 1, ...data }),
  }
  const service = new UserService(mockRepo)

  it('should create user', async () => {
    const result = await service.handleCreate(
      { username: 'john', email: 'john@example.com' },
      1
    )
    expect(result.username).toBe('john')
  })
})
```

### Step 7: Verify

```bash
bun run lint      # Check code quality
bun run typecheck # Check TypeScript
bun run test      # Run tests
bun run verify    # Full verification (lint + typecheck + tests)
```

---

## Common Patterns Reference

### Reading a Record

```typescript
const user = await userRepo.getById(userId)
if (!user) throw new NotFoundError('User', userId)
```

### Creating a Record

```typescript
await checkConflict({
  table: usersTable,
  fields: [{ column: usersTable.email, code: 'EMAIL_EXISTS' }],
  input: { email: data.email }
})
const user = await userRepo.create({
  ...data,
  createdBy: actorId,
})
```

### Updating a Record

```typescript
const existing = await userRepo.getById(userId)
if (!existing) throw new NotFoundError('User', userId)

await checkConflict({
  table: usersTable,
  fields: [{ column: usersTable.email, code: 'EMAIL_EXISTS' }],
  input: { email: data.email },
  existing
})
const updated = await userRepo.update(userId, {
  ...data,
  updatedBy: actorId,
})

await cache.delete(USER_CACHE_KEYS.DETAIL(userId))
await cache.delete(USER_CACHE_KEYS.LIST)
```

### Deleting a Record

```typescript
const existing = await userRepo.getById(userId)
if (!existing) throw new NotFoundError('User', userId)

await userRepo.delete(userId)
await cache.delete(USER_CACHE_KEYS.DETAIL(userId))
await cache.delete(USER_CACHE_KEYS.LIST)
```

### Bulk Operations

```typescript
// Read: single batch query
const items = await itemRepo.getByIds(itemIds)

// Process: in-memory operations
const processed = items.map(item => ({
  ...item,
  status: 'processed',
}))

// Write: single batch mutation
await itemRepo.bulkUpdate(itemIds, { status: 'processed' })
```

### Joining Related Data

```typescript
const users = await userRepo.getList({})
const roles = await roleRepo.getAll()

const roleMap = new RelationMap(roles, r => r.id)
const result = users.map(u => ({
  ...u,
  role: roleMap.getRequired(u.roleId),
}))
```

---

## Checklist for Code Review

When reviewing code or implementing features, verify:

- [ ] **Structure**: Module has dto/, repo/, service/, router/ directories
- [ ] **Type Safety**: No `any` types, all parameters/returns typed
- [ ] **DTOs**: Use spread-shape pattern, not `.extend()`
- [ ] **Repository**: QUERY / MUTATION / PRIVATE sections, all methods wrapped in `record()`
- [ ] **Service**: `handleX` prefix for public, cache invalidation on mutations
- [ ] **Router**: Inline async functions, proper validation, `auth: true` where needed
- [ ] **Error Handling**: Throws custom errors, not null returns
- [ ] **Caching**: Uses namespaced cache with constant keys
- [ ] **Uniqueness**: Uses `checkConflict()` for CREATE/UPDATE
- [ ] **Audit**: All mutations include `createdBy` / `updatedBy`
- [ ] **Batch Ops**: Uses `inArray()` for bulk queries, not loops
- [ ] **Telemetry**: All repo methods wrapped in `record()`
- [ ] **Tests**: Service/router tests with mocks
- [ ] **Linting**: `bun run lint` passes
- [ ] **Types**: `bun run typecheck` passes
- [ ] **Dependencies**: No circular dependencies

---

## Summary

This architecture provides:

✅ **Type Safety**: Strict TypeScript + Zod validation end-to-end  
✅ **Performance**: Batch operations, caching, parallel queries  
✅ **Maintainability**: Clear patterns, low duplication, easy to test  
✅ **Scalability**: Modular design with clear dependency layers  
✅ **Observability**: Comprehensive telemetry and logging  
✅ **Safety**: Explicit error handling, audit trails, data integrity  

By following these patterns consistently, the codebase remains:
- Easy to understand for new developers
- Safe from common bugs (N+1 queries, race conditions, type errors)
- Ready for AI assistance (clear patterns for code generation)
- Production-ready (type-safe, tested, performant)

