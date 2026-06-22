# Code Patterns & Best Practices

**Version**: 1.0  
**Last Updated**: 2026-06-22

Complete reference for common patterns in Ikki ERP Server.

---

## Table of Contents

1. [Zod Schema Patterns](#zod-schema-patterns)
2. [Service Patterns](#service-patterns)
3. [Repository Patterns](#repository-patterns)
4. [Error Handling](#error-handling)
5. [Caching Patterns](#caching-patterns)
6. [Audit Trail](#audit-trail)
7. [Batch Operations](#batch-operations)
8. [Transaction Patterns](#transaction-patterns)
9. [RelationMap (In-Memory JOIN)](#relationmap-in-memory-join)

---

## Zod Schema Patterns

### ✅ Use Spread-Shape (NOT .extend())

```ts
// ❌ BAD: .extend() breaks type inference
const UserUpdateDto = UserCreateDto.extend({
  id: z.number(),
})

// ✅ GOOD: Use spread-shape
const UserUpdateDto = z.object({
  ...zc.RecordId.shape,      // { id: number }
  ...UserMutationDto.shape,  // reusable mutation fields
})
```

### Reusable Mutation Shape

```ts
// user.contract.ts
import { z } from 'zod'
import { zc, zp } from '@/shared/schema'

// Entity DTO (output from DB)
export const UserDto = z.object({
  id: zp.id,
  email: zp.str,
  username: zp.str,
  fullname: zp.str,
  isActive: zp.bool,
  ...zc.AuditBasic.shape,  // createdAt, updatedAt, createdBy, updatedBy
})
export type UserDto = z.infer<typeof UserDto>

// Reusable mutation shape
const UserMutationDto = z.object({
  email: zc.email,
  username: zc.username,
  fullname: zc.fullname,
  isActive: zp.bool.default(true),
})

// Create DTO (HTTP POST)
export const UserCreateDto = z.object({
  ...UserMutationDto.shape,
  password: zc.password,
})
export type UserCreateDto = z.infer<typeof UserCreateDto>

// Update DTO (HTTP PATCH)
export const UserUpdateDto = z.object({
  ...zc.RecordId.shape,       // { id: number }
  ...UserMutationDto.shape,
  password: zc.password.optional(),
})
export type UserUpdateDto = z.infer<typeof UserUpdateDto>
```

### Filter/Query DTO

```ts
// location.contract.ts
export const LocationFilterDto = z.object({
  ...zc.PaginationQuery.shape,  // page, limit
  type: z.enum(['WAREHOUSE', 'STORE', 'SUPPLIER']).optional(),
  search: zp.str.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
```

---

## Service Patterns

### Service Structure

```ts
import { record } from '@elysiajs/opentelemetry'
import { CacheService, type CacheClient } from '@/infra/cache'
import type { ActorId } from '@/types/utils'
import type { XxxRepo } from './xxx.repo'
import type { XxxDto, XxxCreateDto, XxxUpdateDto } from './xxx.contract'

export class XxxService {
  private readonly cache: CacheService

  constructor(
    private readonly repo: XxxRepo,
    cacheClient: CacheClient,
  ) {
    this.cache = CacheService.createWithDefaultKeys(cacheClient, 'xxx')
  }

  // Public methods: handleX
  @record('xxx.create')
  async handleCreate(dto: XxxCreateDto, actor: ActorId): Promise<XxxDto> {
    // Implementation
  }

  @record('xxx.update')
  async handleUpdate(dto: XxxUpdateDto, actor: ActorId): Promise<XxxDto> {
    // Implementation
  }

  @record('xxx.getById')
  async handleGetById(id: number): Promise<XxxDto> {
    // Implementation
  }

  // Private helpers: no prefix
  private async validateBusinessRule(data: XxxDto): Promise<void> {
    // Implementation
  }
}
```

### Create Pattern

```ts
@record('location.create')
async handleCreate(dto: LocationCreateDto, actor: ActorId): Promise<LocationDto> {
  // 1. Check conflicts (unique fields)
  await checkConflict(this.repo.db, uniqueFields, dto)

  // 2. Validate business rules (if any)
  await this.validateBusinessRule(dto)

  // 3. Create in DB
  const location = await this.repo.create({
    ...dto,
    ...stampCreate(actor),  // Add createdAt, createdBy
  })

  // 4. Invalidate cache
  await this.cache.deleteAll()

  return location
}
```

### Update Pattern

```ts
@record('location.update')
async handleUpdate(dto: LocationUpdateDto, actor: ActorId): Promise<LocationDto> {
  // 1. Check exists
  const existing = await this.repo.findById(dto.id)
  if (!existing) {
    throw new NotFoundError('Location not found', {
      code: 'LOCATION_NOT_FOUND',
      context: { id: dto.id },
    })
  }

  // 2. Check conflicts (exclude current record)
  await checkConflict(this.repo.db, uniqueFields, dto, dto.id)

  // 3. Validate business rules
  await this.validateBusinessRule(dto)

  // 4. Update in DB
  const updated = await this.repo.update(dto.id, {
    ...dto,
    ...stampUpdate(actor),  // Add updatedAt, updatedBy
  })

  // 5. Invalidate cache
  await this.cache.delete(dto.id)
  await this.cache.deleteAll()

  return updated
}
```

### Get Pattern (with cache)

```ts
@record('location.getById')
async handleGetById(id: number): Promise<LocationDto> {
  return await this.cache.getOrSet(id, async () => {
    const location = await this.repo.findById(id)
    if (!location) {
      throw new NotFoundError('Location not found', {
        code: 'LOCATION_NOT_FOUND',
        context: { id },
      })
    }
    return location
  })
}
```

### List Pattern (with pagination)

```ts
@record('location.list')
async handleList(filter: LocationFilterDto): Promise<WithPaginationResult<LocationDto>> {
  return await this.cache.getOrSet(`list:${JSON.stringify(filter)}`, async () => {
    return await this.repo.findWithPagination(filter)
  })
}
```

### Delete Pattern

```ts
@record('location.delete')
async handleDelete(id: number, actor: ActorId): Promise<void> {
  // 1. Check exists
  const existing = await this.repo.findById(id)
  if (!existing) {
    throw new NotFoundError('Location not found', {
      code: 'LOCATION_NOT_FOUND',
      context: { id },
    })
  }

  // 2. Check dependencies (if any)
  const hasUsers = await this.userRepo.existsByLocationId(id)
  if (hasUsers) {
    throw new ConflictError('Cannot delete location with assigned users', {
      code: 'LOCATION_HAS_USERS',
      context: { id },
    })
  }

  // 3. Delete
  await this.repo.delete(id)

  // 4. Invalidate cache
  await this.cache.delete(id)
  await this.cache.deleteAll()
}
```

---

## Repository Patterns

### Basic CRUD

```ts
import { eq, and, inArray, like, sql } from 'drizzle-orm'
import type { DbContext } from '@/infra/database'
import { xxxTable } from '@/db/schema'
import type { XxxDto, XxxCreateDto } from './xxx.contract'

export class XxxRepo {
  constructor(readonly db: DbContext) {}

  // Find by ID
  async findById(id: number): Promise<XxxDto | null> {
    return await this.db
      .select()
      .from(xxxTable)
      .where(eq(xxxTable.id, id))
      .then(rows => rows[0] ?? null)
  }

  // Find by IDs (batch)
  async findByIds(ids: number[]): Promise<XxxDto[]> {
    if (ids.length === 0) return []
    return await this.db
      .select()
      .from(xxxTable)
      .where(inArray(xxxTable.id, ids))
  }

  // Create
  async create(data: XxxCreateDto): Promise<XxxDto> {
    return await this.db
      .insert(xxxTable)
      .values(data)
      .returning()
      .then(rows => rows[0])
  }

  // Update
  async update(id: number, data: Partial<XxxDto>): Promise<XxxDto> {
    return await this.db
      .update(xxxTable)
      .set(data)
      .where(eq(xxxTable.id, id))
      .returning()
      .then(rows => rows[0])
  }

  // Delete
  async delete(id: number): Promise<void> {
    await this.db.delete(xxxTable).where(eq(xxxTable.id, id))
  }
}
```

### Pagination Pattern

```ts
import { paginate } from '@/infra/database'
import type { WithPaginationResult } from '@/types/pagination'

async findWithPagination(
  filter: XxxFilterDto,
): Promise<WithPaginationResult<XxxDto>> {
  const query = this.db.select().from(xxxTable)

  // Apply filters
  const conditions = []
  if (filter.type) {
    conditions.push(eq(xxxTable.type, filter.type))
  }
  if (filter.search) {
    conditions.push(like(xxxTable.name, `%${filter.search}%`))
  }
  if (conditions.length > 0) {
    query.where(and(...conditions))
  }

  // Paginate
  return await paginate(query, {
    page: filter.page,
    limit: filter.limit,
  })
}
```

### Exists Check

```ts
async existsById(id: number): Promise<boolean> {
  const result = await this.db
    .select({ count: sql<number>`count(*)` })
    .from(xxxTable)
    .where(eq(xxxTable.id, id))
    .then(rows => rows[0])
  return result.count > 0
}
```

### Insert Many (Bulk)

```ts
async insertMany(data: XxxCreateDto[]): Promise<XxxDto[]> {
  if (data.length === 0) return []
  return await this.db
    .insert(xxxTable)
    .values(data)
    .returning()
}
```

---

## Error Handling

### Custom Error Classes

```ts
import { NotFoundError, ConflictError, BadRequestError } from '@/shared/errors/http-error'

// Not Found
throw new NotFoundError('User not found', {
  code: 'USER_NOT_FOUND',
  context: { id },
})

// Conflict
throw new ConflictError('Email already exists', {
  code: 'USER_EMAIL_ALREADY_EXISTS',
  context: { email },
})

// Bad Request
throw new BadRequestError('Invalid password', {
  code: 'USER_INVALID_PASSWORD',
  context: { reason: 'Too short' },
})
```

### Error Constants Pattern

```ts
// location.internal.ts
import { NotFoundError, ConflictError } from '@/shared/errors/http-error'

export const LocationError = {
  notFound: (id: number) =>
    new NotFoundError('Location not found', {
      code: 'LOCATION_NOT_FOUND',
      context: { id },
    }),
  
  nameExists: (name: string) =>
    new ConflictError('Location name already exists', {
      code: 'LOCATION_NAME_ALREADY_EXISTS',
      context: { name },
    }),
  
  hasUsers: (id: number, count: number) =>
    new ConflictError('Cannot delete location with assigned users', {
      code: 'LOCATION_HAS_USERS',
      context: { id, userCount: count },
    }),
}

// Usage in service
throw LocationError.notFound(id)
```

---

## Caching Patterns

### Basic Cache

```ts
// Get or set
const location = await this.cache.getOrSet(id, async () => {
  return await this.repo.findById(id)
})

// Set with TTL (5 minutes)
await this.cache.set(id, location, 300)

// Delete single
await this.cache.delete(id)

// Delete all (wildcard)
await this.cache.deleteAll()
```

### List Cache with Filter

```ts
async handleList(filter: LocationFilterDto): Promise<WithPaginationResult<LocationDto>> {
  const cacheKey = `list:${JSON.stringify(filter)}`
  
  return await this.cache.getOrSet(cacheKey, async () => {
    return await this.repo.findWithPagination(filter)
  })
}

// Invalidate on mutation
async handleCreate(dto: LocationCreateDto, actor: ActorId): Promise<LocationDto> {
  const location = await this.repo.create({ ...dto, ...stampCreate(actor) })
  
  // Invalidate all list caches
  await this.cache.deleteAll()
  
  return location
}
```

---

## Audit Trail

### Stamp Helpers

```ts
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

// Create
const location = await this.repo.create({
  ...dto,
  ...stampCreate(actor),  // Adds: createdAt, createdBy
})

// Update
const updated = await this.repo.update(id, {
  ...dto,
  ...stampUpdate(actor),  // Adds: updatedAt, updatedBy
})
```

### Schema Definition

```ts
// db/schema/common.ts
import { timestamp, integer } from 'drizzle-orm/pg-core'

export const auditFields = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by').notNull(),
}

// Usage in table
export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ...auditFields,
})
```

---

## Batch Operations

### ❌ BAD: N+1 Query Pattern

```ts
// DON'T DO THIS
const users = await this.userRepo.findAll()
for (const user of users) {
  const location = await this.locationRepo.findById(user.defaultLocationId)
  user.location = location  // N queries!
}
```

### ✅ GOOD: Batch with RelationMap

```ts
// Get all users
const users = await this.userRepo.findAll()

// Get unique location IDs
const locationIds = [...new Set(users.map(u => u.defaultLocationId).filter(Boolean))]

// Batch fetch locations
const locations = await this.locationRepo.findByIds(locationIds)
const locationMap = RelationMap.fromArray(locations, v => v.id)

// Attach locations (in-memory JOIN)
const result = users.map(user => ({
  ...user,
  location: user.defaultLocationId ? locationMap.get(user.defaultLocationId) : null,
}))
```

---

## Transaction Patterns

### Simple Transaction

```ts
import { db } from '@/db'

async handleTransfer(from: number, to: number, amount: number, actor: ActorId): Promise<void> {
  await db.transaction(async (tx) => {
    // Deduct from source
    await tx
      .update(accountsTable)
      .set({ balance: sql`balance - ${amount}`, ...stampUpdate(actor) })
      .where(eq(accountsTable.id, from))

    // Add to destination
    await tx
      .update(accountsTable)
      .set({ balance: sql`balance + ${amount}`, ...stampUpdate(actor) })
      .where(eq(accountsTable.id, to))
  })
}
```

### Transaction with Rollback

```ts
async handleComplexOperation(dto: ComplexDto, actor: ActorId): Promise<ResultDto> {
  try {
    return await db.transaction(async (tx) => {
      // Step 1: Create main record
      const main = await tx.insert(mainTable).values({
        ...dto,
        ...stampCreate(actor),
      }).returning().then(rows => rows[0])

      // Step 2: Create related records
      if (dto.items.length > 0) {
        await tx.insert(itemsTable).values(
          dto.items.map(item => ({
            ...item,
            mainId: main.id,
            ...stampCreate(actor),
          }))
        )
      }

      return main
    })
  } catch (error) {
    // Transaction auto-rolled back
    throw new InternalServerError('Operation failed', {
      code: 'COMPLEX_OPERATION_FAILED',
      cause: error,
    })
  }
}
```

---

## RelationMap (In-Memory JOIN)

### Basic Usage

```ts
import { RelationMap } from '@/shared/utils'

// Create from array
const locations = await this.locationRepo.findByIds([1, 2, 3])
const locationMap = RelationMap.fromArray(locations, v => v.id)

// Get by key
const location = locationMap.get(1)  // LocationDto | undefined

// Get or throw
const location = locationMap.getOrThrow(1, () => LocationError.notFound(1))
```

### Service Helper

```ts
// location.service.ts
export class LocationService {
  // Helper for other services
  toRelationMap(items: LocationDto[]): RelationMap<number, LocationDto> {
    return RelationMap.fromArray(items, (v) => v.id)
  }
}

// Usage in another service
const locationMap = this.deps.location.toRelationMap(locations)
```

### Complex JOIN Simulation

```ts
// Get users with roles and locations
async handleGetUsersWithRelations(): Promise<UserWithRelationsDto[]> {
  // 1. Get users
  const users = await this.userRepo.findAll()

  // 2. Get assignments
  const assignments = await this.assignmentRepo.findByUserIds(users.map(u => u.id))

  // 3. Get unique role IDs and location IDs
  const roleIds = [...new Set(assignments.map(a => a.roleId))]
  const locationIds = [...new Set([
    ...users.map(u => u.defaultLocationId).filter(Boolean),
    ...assignments.map(a => a.locationId),
  ])]

  // 4. Batch fetch
  const [roles, locations] = await Promise.all([
    this.roleRepo.findByIds(roleIds),
    this.locationRepo.findByIds(locationIds),
  ])

  // 5. Create relation maps
  const roleMap = RelationMap.fromArray(roles, v => v.id)
  const locationMap = RelationMap.fromArray(locations, v => v.id)

  // 6. Attach relations (in-memory JOIN)
  return users.map(user => {
    const userAssignments = assignments
      .filter(a => a.userId === user.id)
      .map(a => ({
        ...a,
        role: roleMap.get(a.roleId),
        location: locationMap.get(a.locationId),
      }))

    return {
      ...user,
      defaultLocation: user.defaultLocationId
        ? locationMap.get(user.defaultLocationId)
        : null,
      assignments: userAssignments,
    }
  })
}
```

---

## Conflict Checking

### Define Unique Fields

```ts
import { checkConflict, type ConflictField } from '@/infra/database'
import { usersTable } from '@/db/schema'

const uniqueFields: ConflictField<{ email: string; username: string }>[] = [
  {
    field: 'email',
    column: usersTable.email,
    message: 'Email already exists',
    code: 'USER_EMAIL_ALREADY_EXISTS',
  },
  {
    field: 'username',
    column: usersTable.username,
    message: 'Username already exists',
    code: 'USER_USERNAME_ALREADY_EXISTS',
  },
]
```

### Check on Create

```ts
async handleCreate(dto: UserCreateDto, actor: ActorId): Promise<UserDto> {
  // Check conflicts (no excludeId)
  await checkConflict(this.repo.db, uniqueFields, dto)

  const user = await this.repo.create({
    ...dto,
    ...stampCreate(actor),
  })

  return user
}
```

### Check on Update

```ts
async handleUpdate(dto: UserUpdateDto, actor: ActorId): Promise<UserDto> {
  // Check conflicts (exclude current record)
  await checkConflict(this.repo.db, uniqueFields, dto, dto.id)

  const updated = await this.repo.update(dto.id, {
    ...dto,
    ...stampUpdate(actor),
  })

  return updated
}
```

---

## Module Factory Pattern

### Simple Module

```ts
// location.module.ts
export interface LocationModule {
  location: LocationService
}

export function createLocationModule(
  db: DbContext,
  cacheClient: CacheClient,
): LocationModule {
  const repo = new LocationRepo(db)
  const service = new LocationService(repo, cacheClient)

  return { location: service }
}
```

### Complex Module with Dependencies

```ts
// iam.module.ts
interface Deps {
  location: LocationModule
}

export interface IamModule {
  user: UserService
  role: RoleService
  assignment: UserAssignmentService
  composed: IamComposedService
}

export function createIamModule(
  db: DbContext,
  cacheClient: CacheClient,
  deps: Deps,
): IamModule {
  // 1. Create repos
  const userRepo = new UserRepo(db)
  const roleRepo = new RoleRepo(db)
  const assignmentRepo = new UserAssignmentRepo(db)
  const composedRepo = new IamComposedRepo(db)

  // 2. Create services (resolve dependencies bottom-up)
  const role = new RoleService(roleRepo, cacheClient)
  const assignment = new UserAssignmentService(assignmentRepo, cacheClient)
  
  const user = new UserService(
    { location: deps.location, assignment, role },
    userRepo,
    cacheClient,
  )
  
  const composed = new IamComposedService(
    { role, assignment, user, location: deps.location },
    composedRepo,
  )

  return { user, role, assignment, composed }
}
```

---

## Route Patterns

### Basic CRUD Routes

```ts
import { Elysia, t } from 'elysia'
import type { Modules } from '@/modules/_registry'
import { XxxCreateDto, XxxUpdateDto } from './xxx.contract'

export const xxxRoutes = (app: Elysia, modules: Modules) =>
  app.group('/xxx', (app) =>
    app
      // List
      .get('/', async ({ query }) => {
        return await modules.xxx.handleList(query)
      })

      // Detail
      .get('/:id', async ({ params }) => {
        return await modules.xxx.handleGetById(params.id)
      })

      // Create
      .post(
        '/',
        async ({ body, user }) => {
          return await modules.xxx.handleCreate(body, user.id)
        },
        { body: XxxCreateDto },
      )

      // Update
      .patch(
        '/:id',
        async ({ params, body, user }) => {
          return await modules.xxx.handleUpdate(
            { ...body, id: params.id },
            user.id,
          )
        },
        { body: t.Omit(XxxUpdateDto, ['id']) },
      )

      // Delete
      .delete('/:id', async ({ params, user }) => {
        await modules.xxx.handleDelete(params.id, user.id)
        return { success: true }
      })
  )
```

---

## Quick Reference

| Pattern | Use Case | Example |
|---------|----------|---------|
| `handleX` | Public service methods | `handleCreate`, `handleUpdate` |
| `checkConflict` | Unique field validation | Before CREATE/UPDATE |
| `stampCreate/Update` | Audit trail | All mutations |
| `cache.getOrSet` | Read with cache | GET by ID |
| `cache.deleteAll` | Invalidate cache | After CREATE/UPDATE/DELETE |
| `RelationMap` | In-memory JOIN | Prevent N+1 queries |
| `inArray()` | Batch queries | `findByIds()` |
| `paginate()` | List with pagination | `handleList()` |
| `@record` | OTEL tracing | All public methods |

---

**Next:** [MODULE_CHECKLIST.md](./MODULE_CHECKLIST.md) for step-by-step implementation guide.
