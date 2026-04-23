# 🚀 Quick Reference Guide

**For developers implementing features quickly**

---

## New Feature Checklist

### 1️⃣ Define DTOs First

```typescript
// src/modules/feature/dto/entity.dto.ts
import { z } from 'zod'
import { zId, zc, zq } from '@/core/validation'

export const EntityDto = z.object({
  id: zId,
  name: z.string(),
  // ... fields
})

export const EntityCreateDto = z.object({
  name: z.string(),
  // ... required fields only
})

export const EntityUpdateDto = z.object({
  name: z.string().optional(),
  // ... all optional
})

export const EntityFilterDto = z.object({
  ...zq.pagination.shape,
  search: z.string().optional(),
  // ... filter fields
})
```

### 2️⃣ Create Repository

```typescript
// src/modules/feature/repo/entity.repo.ts
import { record } from '@elysiajs/opentelemetry'
import { db } from '@/db'
import { entityTable } from '@/db/schema'

export class EntityRepo {
  async getList(filter: OmitPaginationQuery<EntityFilterDto>) {
    return record('EntityRepo.getList', async () => {
      const where = this.buildWhereClause(filter)
      return db.select().from(entityTable).where(where)
    })
  }

  async getById(id: number) {
    return record('EntityRepo.getById', async () => {
      return db.select().from(entityTable).where(eq(entityTable.id, id)).then(r => r[0])
    })
  }

  async create(data: typeof entityTable.$inferInsert) {
    return record('EntityRepo.create', async () => {
      return db.insert(entityTable).values(data).returning()
    })
  }

  async update(id: number, data: Partial<typeof entityTable.$inferInsert>) {
    return record('EntityRepo.update', async () => {
      return db.update(entityTable).set(data).where(eq(entityTable.id, id)).returning()
    })
  }

  async delete(id: number) {
    return record('EntityRepo.delete', async () => {
      await db.delete(entityTable).where(eq(entityTable.id, id))
    })
  }

  private buildWhereClause(filter: Partial<EntityFilterDto>) {
    const { search } = filter
    return search ? searchFilter(entityTable.name, search) : undefined
  }
}
```

### 3️⃣ Create Service

```typescript
// src/modules/feature/service/entity.service.ts
import { record } from '@elysiajs/opentelemetry'
import { bento } from '@/core/cache'
import { EntityRepo } from '../repo/entity.repo'
import * as dto from '../dto'

const cache = bento.namespace('entity')

export const ENTITY_CACHE_KEYS = {
  LIST: 'entity.list',
  DETAIL: (id: number) => `entity.detail.${id}`,
}

export class EntityService {
  constructor(public repo = new EntityRepo()) {}

  /* ========================================================================== */
  /*                              QUERY OPERATIONS                             */
  /* ========================================================================== */

  async handleList(filter: OmitPaginationQuery<dto.EntityFilterDto>) {
    return record('EntityService.handleList', async () => {
      return this.repo.getList(filter)
    })
  }

  async handleDetail(id: number) {
    return record('EntityService.handleDetail', async () => {
      const cached = await cache.get(ENTITY_CACHE_KEYS.DETAIL(id))
      if (cached) return cached

      const entity = await this.repo.getById(id)
      if (!entity) throw new NotFoundError('Entity', id)

      await cache.set(ENTITY_CACHE_KEYS.DETAIL(id), entity)
      return entity
    })
  }

  /* ========================================================================== */
  /*                              COMMAND OPERATIONS                           */
  /* ========================================================================== */

  async handleCreate(data: dto.EntityCreateDto, actorId: number) {
    return record('EntityService.handleCreate', async () => {
      // Validate uniqueness if needed
      // await checkConflict({ ... })

      const entity = await this.repo.create({
        ...data,
        createdBy: actorId,
        updatedBy: actorId,
      })

      await this.invalidateCaches()
      return entity
    })
  }

  async handleUpdate(id: number, data: dto.EntityUpdateDto, actorId: number) {
    return record('EntityService.handleUpdate', async () => {
      const existing = await this.repo.getById(id)
      if (!existing) throw new NotFoundError('Entity', id)

      const updated = await this.repo.update(id, {
        ...data,
        updatedBy: actorId,
      })

      await this.invalidateCaches()
      await cache.delete(ENTITY_CACHE_KEYS.DETAIL(id))
      return updated
    })
  }

  async handleDelete(id: number) {
    return record('EntityService.handleDelete', async () => {
      const existing = await this.repo.getById(id)
      if (!existing) throw new NotFoundError('Entity', id)

      await this.repo.delete(id)
      await this.invalidateCaches()
      await cache.delete(ENTITY_CACHE_KEYS.DETAIL(id))
    })
  }

  /* ========================================================================== */
  /*                              INTERNAL HELPERS                             */
  /* ========================================================================== */

  private async invalidateCaches() {
    await cache.delete(ENTITY_CACHE_KEYS.LIST)
  }
}
```

### 4️⃣ Create Router

```typescript
// src/modules/feature/router/entity.route.ts
import { Elysia, t } from 'elysia'
import { res } from '@/core/http/response'
import { zId } from '@/core/validation'
import { entityService } from '@/modules/_registry'
import * as dto from '../dto'

async function list({ query }) {
  const result = await entityService.handleList(query)
  return res.ok(result)
}

async function detail({ params }) {
  const entity = await entityService.handleDetail(params.id)
  return res.ok(entity)
}

async function create({ body, auth }) {
  const entity = await entityService.handleCreate(body, auth.userId)
  return res.created(entity)
}

async function update({ params, body, auth }) {
  const entity = await entityService.handleUpdate(params.id, body, auth.userId)
  return res.ok(entity)
}

async function remove({ params }) {
  await entityService.handleDelete(params.id)
  return res.noContent()
}

export const entityRouter = new Elysia({ prefix: '/entities' })
  .get('/list', list, {
    query: dto.EntityFilterDto,
  })
  .get('/:id', detail, {
    params: t.Object({ id: zId }),
  })
  .post('/create', create, {
    auth: true,
    body: dto.EntityCreateDto,
  })
  .put('/:id', update, {
    auth: true,
    params: t.Object({ id: zId }),
    body: dto.EntityUpdateDto,
  })
  .delete('/:id', remove, {
    auth: true,
    params: t.Object({ id: zId }),
  })
```

### 5️⃣ Register Module

```typescript
// src/modules/_registry.ts
import { EntityService } from './feature/service'

export const entityService = new EntityService()

// src/modules/_routes.ts
import { entityRouter } from './feature/router'

export function registerRoutes(app: Elysia) {
  app.use(entityRouter)
  // ... other routes
  return app
}
```

### 6️⃣ Write Tests

```typescript
// src/modules/feature/service/entity.service.test.ts
import { describe, expect, it } from 'bun:test'
import { EntityService } from './entity.service'

describe('EntityService', () => {
  const mockRepo = {
    getById: async (id) => ({ id, name: 'Test' }),
    getList: async () => [{ id: 1, name: 'Test' }],
    create: async (data) => ({ id: 1, ...data }),
    update: async (id, data) => ({ id, ...data }),
    delete: async () => {},
  }

  const service = new EntityService(mockRepo)

  it('should list entities', async () => {
    const result = await service.handleList({})
    expect(result).toHaveLength(1)
  })

  it('should get entity by id', async () => {
    const result = await service.handleDetail(1)
    expect(result.id).toBe(1)
  })

  it('should create entity', async () => {
    const result = await service.handleCreate({ name: 'New' }, 1)
    expect(result.name).toBe('New')
  })
})
```

---

## Common Code Snippets

### Read Single Record

```typescript
const entity = await repo.getById(id)
if (!entity) throw new NotFoundError('Entity', id)
```

### Read Multiple Records (Batch)

```typescript
const entities = await repo.getByIds(ids)
// No null check needed - returns empty array if not found
```

### Check Uniqueness

```typescript
await checkConflict({
  table: entityTable,
  fields: [
    { column: entityTable.email, code: 'EMAIL_EXISTS' },
  ],
  input: { email: data.email }
})
```

### Check Uniqueness on Update

```typescript
const existing = await repo.getById(id)
if (!existing) throw new NotFoundError('Entity', id)

await checkConflict({
  table: entityTable,
  fields: [
    { column: entityTable.email, code: 'EMAIL_EXISTS' },
  ],
  input: { email: data.email },
  existing // Exclude this record from check
})
```

### Cache with TTL

```typescript
const entity = await cache.getOrSet({
  key: ENTITY_CACHE_KEYS.DETAIL(id),
  factory: async () => this.repo.getById(id),
  ttl: 3600, // 1 hour
})
```

### Batch Delete Invalidation

```typescript
await cache.deleteMany({
  keys: [
    ENTITY_CACHE_KEYS.LIST,
    ...ids.map(id => ENTITY_CACHE_KEYS.DETAIL(id))
  ]
})
```

### Parallel Queries

```typescript
const [data, total] = await Promise.all([
  db.select().from(table).limit(20).offset(0),
  db.select({ count: count() }).from(table),
])
```

### Bulk Update with inArray

```typescript
await db
  .update(entityTable)
  .set({ status: 'active', updatedBy: actorId })
  .where(inArray(entityTable.id, ids))
```

### Bulk Delete with inArray

```typescript
await db
  .delete(entityTable)
  .where(inArray(entityTable.id, ids))
```

### Transaction

```typescript
await db.transaction(async (tx) => {
  await tx.delete(entityTable).where(eq(entityTable.parentId, parentId))
  await tx.insert(entityTable).values(newRecords)
})
```

### Relationship Join (RelationMap)

```typescript
const items = await itemRepo.getList({})
const categories = await categoryRepo.getAll()

const categoryMap = new RelationMap(categories, c => c.id)
const itemsWithCategories = items.map(item => ({
  ...item,
  category: categoryMap.getRequired(item.categoryId),
}))
```

---

## Error Handling Quick Reference

| Error | Status | When | Code |
|-------|--------|------|------|
| NotFoundError | 404 | Resource doesn't exist | `NOT_FOUND` |
| ConflictError | 409 | Duplicate/conflict (email taken) | `EMAIL_EXISTS` |
| BadRequestError | 400 | Invalid input | `INVALID_INPUT` |
| UnauthorizedError | 401 | Missing/invalid auth | `UNAUTHORIZED` |
| ForbiddenError | 403 | Not permitted | `FORBIDDEN` |
| InternalServerError | 500 | Server error | `INTERNAL` |

```typescript
// Usage
throw new NotFoundError('User', userId)
throw new ConflictError('Email already taken', 'EMAIL_EXISTS')
throw new ForbiddenError('Not authorized to delete')
```

---

## Response Format Quick Reference

```typescript
// Single object
res.ok(data)
// { success: true, code: 'OK', data }

// List with pagination
res.paginated({ data: [...], meta: { total, page, limit, pages } })
// { success: true, code: 'OK', data: [...], meta: {...} }

// Created (201)
res.created(data)
// { success: true, code: 'CREATED', data }

// No content (204)
res.noContent()
// undefined (Elysia returns 204)

// Error
throw new NotFoundError('User', 123)
// { success: false, code: 'NOT_FOUND', message: 'User #123 not found', statusCode: 404 }
```

---

## Validation Quick Reference

```typescript
// Core validators
zId // number (positive integer)
zc.email() // valid email
zc.password() // password (min 8)
zc.username() // username (3-50 chars)
zq.pagination // { page, limit }

// Composition
z.object({
  ...BaseDto.shape,
  newField: z.string(),
})

// Arrays
z.array(zId)

// Optional
z.string().optional()
```

---

## Performance Checklist

- [ ] Single query for batch reads (use `inArray()`)
- [ ] Parallel queries for independent data (use `Promise.all()`)
- [ ] Cache expensive reads (use `bento.namespace()`)
- [ ] Invalidate caches on writes
- [ ] Use batch mutations (one transaction, not loop)
- [ ] Wrap all repo methods with `record()`
- [ ] Select only needed columns
- [ ] Use indexes for frequently filtered fields

---

## Type Safety Checklist

- [ ] No `any` types
- [ ] All parameters typed
- [ ] All return types explicit
- [ ] Use spread-shape for DTO composition (not `.extend()`)
- [ ] Generic types properly constrained
- [ ] Type inference preserved

---

## Testing Checklist

- [ ] Service tested with mocked repo
- [ ] Happy path covered
- [ ] Error scenarios tested (missing records, conflicts)
- [ ] Edge cases covered (empty arrays, null values)
- [ ] Tests colocated with code (`.test.ts`)

---

## Deployment Checklist

```bash
bun run lint      # ✅ No linting errors
bun run typecheck # ✅ No TypeScript errors
bun run test      # ✅ All tests pass
bun run verify    # ✅ Full verification
git add .
git commit -m "feat: add entity module"
git push
```

---

## Useful Commands

```bash
# Development
bun run dev:server      # Start dev server
bun run dev:debug       # Start with debugger

# Testing
bun test                # Run all tests
bun test src/path.test.ts # Run single test

# Database
bun run db:generate     # Generate migration
bun run db:migrate      # Apply migration
bun run db:studio       # Open Drizzle Studio
bun run db:reset        # Reset database
bun run db:seed         # Seed production data
bun run db:seed-dev     # Seed dev data

# Quality
bun run lint            # Check linting
bun run format          # Format code
bun run typecheck       # Type check
bun run verify          # Full verification (lint + typecheck + tests)
bun run check-deps      # Check for circular dependencies

# Build
bun run build           # Build for production
```

---

## File Structure Template

```
src/modules/feature/
├── dto/
│   ├── index.ts                  # Re-exports
│   ├── entity.dto.ts             # Zod schemas
│   └── constants.ts              # Module constants
├── repo/
│   ├── index.ts                  # Re-exports
│   └── entity.repo.ts            # Drizzle queries
├── service/
│   ├── index.ts                  # Re-exports
│   └── entity.service.ts         # Business logic
│   └── entity.service.test.ts    # Service tests
├── router/
│   ├── index.ts                  # Re-exports
│   └── entity.route.ts           # HTTP handlers
│   └── entity.route.test.ts      # Integration tests
├── index.ts                      # Module public API
└── constants.ts                  # Module constants
```

---

## When to Use What

| Use Case | Pattern |
|----------|---------|
| Single record fetch | `repo.getById()` + null check → throw error |
| Multiple records | `repo.getByIds()` (batch in one query) |
| Filtered list | `repo.getList(filter)` |
| Paginated results | `repo.getListPaginated(filter)` with `paginate()` |
| Unique constraint | `checkConflict()` before create/update |
| Relationship join | `RelationMap` for 2 queries → in-memory join |
| Parallel independent queries | `Promise.all([query1, query2])` |
| Multiple related mutations | `db.transaction()` |
| Expensive reads | `cache.getOrSet()` |
| Write invalidation | `cache.delete()` or `cache.deleteMany()` |

---

## Remember

✨ **The Golden Rules:**

1. **Repo** = Data access (queries, no logic)
2. **Service** = Business logic (validation, caching, auditing)
3. **Router** = HTTP handling (validation, response formatting)
4. **DTOs** = Validation schemas (Zod, spread-shape)
5. **Errors** = Throw, don't return (let framework handle)
6. **Cache** = Invalidate on writes (not just reads)
7. **Performance** = Batch operations, parallel queries
8. **Type Safety** = No `any`, preserve inference
9. **Audit** = Every write has `createdBy` / `updatedBy`
10. **Telemetry** = Wrap repo methods with `record()`

