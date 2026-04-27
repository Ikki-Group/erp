# 🚀 Code Patterns — Quick Reference

**Golden Path 2.0 — Backend (Simplified)**

> **Note**: For complete standards, see [SERVER_STANDARDS.md](./SERVER_STANDARDS.md)

---

## New Module Checklist

### 1️⃣ DTO

```typescript
// src/modules/feature/dto/entity.dto.ts
import { z } from 'zod'
import { zc, zp, zq } from '@/core/validation'

// Entity shape (DB output)
export const EntityDto = z.object({
  ...zc.RecordId.shape,
  name: zp.str,
  code: zp.str,
  ...zc.AuditBasic.shape,
})
export type EntityDto = z.infer<typeof EntityDto>

// Mutation inputs
const EntityMutationDto = z.object({
  name: zp.str,
  code: zp.str,
})

export const EntityCreateDto = EntityMutationDto
export type EntityCreateDto = z.infer<typeof EntityCreateDto>

export const EntityUpdateDto = z.object({
  ...zc.RecordId.shape,
  ...EntityMutationDto.shape,
})
export type EntityUpdateDto = z.infer<typeof EntityUpdateDto>

// Filter for list/search
export const EntityFilterDto = z.object({
  ...zq.pagination.shape,
  q: zq.search,
})
export type EntityFilterDto = z.infer<typeof EntityFilterDto>
```

### 2️⃣ Constants & Errors

```typescript
// src/modules/feature/constants.ts
export const ENTITY_CACHE_KEYS = {
  LIST: 'list',
  COUNT: 'count',
  DETAIL: (id: number) => `detail.${id}`,
}

// src/modules/feature/errors.ts
import { NotFoundError, InternalServerError } from '@/core/http/errors'

export const EntityErrors = {
  notFound: (id: number) =>
    new NotFoundError(`Entity with ID ${id} not found`, 'ENTITY_NOT_FOUND'),
  createFailed: () =>
    new InternalServerError('Entity creation failed', 'ENTITY_CREATE_FAILED'),
}
```

### 3️⃣ Repository

```typescript
// src/modules/feature/repo/entity.repo.ts
import { record } from '@elysiajs/opentelemetry'
import { and, count, eq } from 'drizzle-orm'
import { paginate, searchFilter, stampCreate, stampUpdate } from '@/core/database'
import { db } from '@/db'
import { entityTable } from '@/db/schema'
import * as dto from '../dto/entity.dto'

export class EntityRepo {
  /* ------------------------------------------------------------------ */
  /*  QUERY                                                               */
  /* ------------------------------------------------------------------ */

  async getList(): Promise<dto.EntityDto[]> {
    return record('EntityRepo.getList', async () => {
      return db.select().from(entityTable)
    })
  }

  async getListPaginated(filter: dto.EntityFilterDto) {
    return record('EntityRepo.getListPaginated', async () => {
      const where = this.buildWhereClause(filter)
      return paginate<dto.EntityDto>({
        data: ({ limit, offset }) =>
          db.select().from(entityTable).where(where).limit(limit).offset(offset),
        pq: { page: filter.page, limit: filter.limit },
        countQuery: db.select({ count: count() }).from(entityTable).where(where),
      })
    })
  }

  async getById(id: number): Promise<dto.EntityDto | undefined> {
    return record('EntityRepo.getById', async () => {
      return db.select().from(entityTable).where(eq(entityTable.id, id)).then(r => r[0])
    })
  }

  async count(): Promise<number> {
    return record('EntityRepo.count', async () => {
      return db.select({ count: count() }).from(entityTable)
        .then(r => r[0]?.count ?? 0)
    })
  }

  /* ------------------------------------------------------------------ */
  /*  MUTATION                                                            */
  /* ------------------------------------------------------------------ */

  async create(data: dto.EntityCreateDto, actorId: number): Promise<number | undefined> {
    return record('EntityRepo.create', async () => {
      return db
        .insert(entityTable)
        .values({ ...stampCreate(actorId), ...data })
        .returning({ id: entityTable.id })
        .then(r => r[0]?.id)
    })
  }

  async update(data: dto.EntityUpdateDto, actorId: number): Promise<number | undefined> {
    return record('EntityRepo.update', async () => {
      return db
        .update(entityTable)
        .set({ ...stampUpdate(actorId), ...data })
        .where(eq(entityTable.id, data.id))
        .returning({ id: entityTable.id })
        .then(r => r[0]?.id)
    })
  }

  async remove(id: number): Promise<number | undefined> {
    return record('EntityRepo.remove', async () => {
      return db
        .delete(entityTable)
        .where(eq(entityTable.id, id))
        .returning({ id: entityTable.id })
        .then(r => r[0]?.id)
    })
  }

  /* ------------------------------------------------------------------ */
  /*  PRIVATE                                                             */
  /* ------------------------------------------------------------------ */

  private buildWhereClause(filter: Partial<dto.EntityFilterDto>) {
    const { q } = filter
    return and(q ? searchFilter(entityTable.name, q) : undefined)
  }
}
```

### 4️⃣ Service

```typescript
// src/modules/feature/service/entity.service.ts
import { record } from '@elysiajs/opentelemetry'
import { bento } from '@/core/cache'
import * as core from '@/core/database'
import { entityTable } from '@/db/schema'
import { CACHE_KEY_DEFAULT } from '@/core/cache'
import * as dto from '../dto/entity.dto'
import { EntityErrors } from '../errors'
import { EntityRepo } from '../repo/entity.repo'

const cache = bento.namespace('entity')

const conflictFields: core.ConflictField<'code' | 'name'>[] = [
  { field: 'code', column: entityTable.code, message: 'Code exists', code: 'ENTITY_CODE_EXISTS' },
  { field: 'name', column: entityTable.name, message: 'Name exists', code: 'ENTITY_NAME_EXISTS' },
]

export class EntityService {
  // ✅ repo is private readonly — never exposed
  constructor(private readonly repo = new EntityRepo()) {}

  /* ================================================================== */
  /*  CACHE MANAGEMENT (always private)                                  */
  /* ================================================================== */

  private async clearCache(id?: number): Promise<void> {
    const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
    if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
    await cache.deleteMany({ keys })
  }

  /* ================================================================== */
  /*  QUERY — get*() — callable by other services                       */
  /* ================================================================== */

  async getList(): Promise<dto.EntityDto[]> {
    return record('EntityService.getList', async () => {
      return cache.getOrSet({
        key: CACHE_KEY_DEFAULT.list,
        factory: async () => this.repo.getList(),
      })
    })
  }

  async getById(id: number): Promise<dto.EntityDto | undefined> {
    return record('EntityService.getById', async () => {
      return cache.getOrSet({
        key: CACHE_KEY_DEFAULT.byId(id),
        factory: async ({ skip }) => {
          const row = await this.repo.getById(id)
          return row ?? skip()
        },
      })
    })
  }

  async count(): Promise<number> {
    return record('EntityService.count', async () => {
      return cache.getOrSet({
        key: CACHE_KEY_DEFAULT.count,
        factory: () => this.repo.count(),
      })
    })
  }

  /* ================================================================== */
  /*  HANDLER — handle*() — called by Router ONLY                       */
  /* ================================================================== */

  async handleList(filter: dto.EntityFilterDto): Promise<core.WithPaginationResult<dto.EntityDto>> {
    return record('EntityService.handleList', async () => {
      return this.repo.getListPaginated(filter)
    })
  }

  async handleDetail(id: number): Promise<dto.EntityDto> {
    return record('EntityService.handleDetail', async () => {
      const result = await this.getById(id)
      if (!result) throw EntityErrors.notFound(id)
      return result
    })
  }

  async handleCreate(data: dto.EntityCreateDto, actorId: number): Promise<{ id: number }> {
    return record('EntityService.handleCreate', async () => {
      await core.checkConflict({
        table: entityTable,
        pkColumn: entityTable.id,
        fields: conflictFields,
        input: data,
      })
      const id = await this.repo.create(data, actorId)
      if (!id) throw EntityErrors.createFailed()
      await this.clearCache()
      return { id }
    })
  }

  async handleUpdate(id: number, data: dto.EntityUpdateDto, actorId: number): Promise<{ id: number }> {
    return record('EntityService.handleUpdate', async () => {
      const existing = await this.getById(id)
      if (!existing) throw EntityErrors.notFound(id)

      await core.checkConflict({
        table: entityTable,
        pkColumn: entityTable.id,
        fields: conflictFields,
        input: data,
        existing,
      })

      const result = await this.repo.update(data, actorId)
      if (!result) throw EntityErrors.notFound(id)

      await this.clearCache(id)
      return { id }
    })
  }

  async handleRemove(id: number): Promise<{ id: number }> {
    return record('EntityService.handleRemove', async () => {
      const result = await this.repo.remove(id)
      if (!result) throw EntityErrors.notFound(id)
      await this.clearCache(id)
      return { id }
    })
  }
}
```

### 5️⃣ Router

```typescript
// src/modules/feature/entity.route.ts (co-located with service)
import { Elysia } from 'elysia'
import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc, zq } from '@/core/validation'
import * as dto from './dto/entity.dto'
import type { EntityService } from './entity.service'

export function initEntityRoute(service: EntityService) {
  return new Elysia({ prefix: '/entity' })
    .use(authPluginMacro)
    .get('/list',
      async function list({ query }) {
        return res.paginated(await service.handleList(query))
      },
      { query: dto.EntityFilterDto, response: createPaginatedResponseSchema(dto.EntityDto), auth: true },
    )
    .get('/detail',
      async function detail({ query }) {
        return res.ok(await service.handleDetail(query.id))
      },
      { query: zq.recordId, response: createSuccessResponseSchema(dto.EntityDto), auth: true },
    )
    .post('/create',
      async function create({ body, auth }) {
        return res.ok(await service.handleCreate(body, auth.userId))
      },
      { body: dto.EntityCreateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
    )
    .put('/update',
      async function update({ body, auth }) {
        return res.ok(await service.handleUpdate(body.id, body, auth.userId))
      },
      { body: dto.EntityUpdateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
    )
    .delete('/remove',
      async function remove({ body }) {
        return res.ok(await service.handleRemove(body.id))
      },
      { body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
    )
}

// src/modules/feature/index.ts
import { initEntityRoute } from './entity.route'

export class FeatureModule {
  // ... service definition ...
  
  initRoutes() {
    return new Elysia({ prefix: '/feature' })
      .use(initEntityRoute(this.service.entity))
  }
}
```

### 6️⃣ Module Index

```typescript
// src/modules/feature/index.ts
// ⚠️ ONLY export the Module class and Services interface
// Do NOT: export * from './dto'
// Do NOT: export * from './service'
// Do NOT: export * from './router'
// ⚠️ NO subfolders — co-located structure

import { EntityService } from './entity.service'

export interface FeatureServices {
  entity: EntityService
}

export class FeatureModule {
  public readonly service: FeatureServices

  constructor() {
    this.service = {
      // ✅ DI via constructor — testable
      entity: new EntityService(),
    }
  }
}
```

### 7️⃣ Register in Registry & Routes

```typescript
// src/modules/_registry.ts
import { FeatureModule } from './feature'

const feature = new FeatureModule()
return { ..., feature }

// src/modules/_routes.ts
import { initFeatureRouteModule } from './feature/router'

routes.push(initFeatureRouteModule(m.feature))
```

---

## Common Snippets

### Read with Cache

```typescript
async getById(id: number): Promise<dto.EntityDto | undefined> {
  return cache.getOrSet({
    key: CACHE_KEY_DEFAULT.byId(id),
    factory: async ({ skip }) => {
      const row = await this.repo.getById(id)
      return row ?? skip() // skip = don't cache undefined
    },
  })
}
```

### Batch Invalidation

```typescript
private async clearCache(id?: number): Promise<void> {
  const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
  if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
  await cache.deleteMany({ keys })
}
```

### In-memory Join (RelationMap)

```typescript
// ✅ 2 queries total, no N+1
const [items, roleMap, locationMap] = await Promise.all([
  this.repo.getList(),
  roleService.getRelationMap(),      // returns RelationMap<id, RoleDto>
  locationService.getRelationMap(),  // returns RelationMap<id, LocationDto>
])

const enriched = items.map(item => ({
  ...item,
  role: roleMap.getRequired(item.roleId),
  location: locationMap.getRequired(item.locationId),
}))
```

### Transaction (Repo layer)

```typescript
async replaceBulkByUserId(userId: number, assignments: AssignmentUpsertDto[], actorId: number): Promise<void> {
  return record('AssignmentRepo.replaceBulkByUserId', async () => {
    await db.transaction(async (tx) => {
      await tx.delete(assignmentsTable).where(eq(assignmentsTable.userId, userId))
      if (assignments.length > 0) {
        await tx.insert(assignmentsTable).values(
          assignments.map(a => ({ ...a, userId, addedAt: new Date(), addedBy: actorId }))
        )
      }
    })
  })
}
```

### Cross-Module Dependency (Lazy Getter)

```typescript
// ✅ Inject lazy getters to avoid circular dependency at bootstrap
export class UserService {
  constructor(
    private repo = new UserRepo(),
    private getRoleService?: () => RoleService,
    private getLocationService?: () => LocationMasterService,
  ) {}

  private async buildDetail(user: UserDto) {
    const roleService = this.getRoleService!()       // called at runtime
    const locationService = this.getLocationService!()
    // ...
  }
}

// In IamModule:
const role = new RoleService()
const user = new UserService(
  undefined,  // use default repo
  () => role,  // lazy getter for cross-module dep
  () => this.getExternalModules().location.location,  // lazy: external
)
```

---

## Testing Patterns

### Test File Locations (Co-located)

```
modules/location/location-master/
├── location-master.service.ts
├── location-master.service.test.ts   # ← co-located
├── location-master.route.ts
├── location-master.route.test.ts     # ← co-located
```

### Skip DTO Tests

❌ **Don't write DTO tests** — Zod validation is tested implicitly via route tests.

### Service Test Pattern

```typescript
import { describe, expect, it, beforeEach } from 'bun:test'
import { EntityService } from './entity.service'
import { EntityRepo } from './entity.repo'

function createFakeRepo(overrides: Partial<EntityRepo> = {}): EntityRepo {
  return {
    getById: async () => undefined,
    getList: async () => [],
    create: async () => 1,
    update: async () => 1,
    remove: async () => 1,
    ...overrides,
  } as EntityRepo
}

describe('EntityService', () => {
  let service: EntityService
  let fakeRepo: EntityRepo

  beforeEach(() => {
    fakeRepo = createFakeRepo()
    service = new EntityService(fakeRepo)  // ✅ inject fake repo
  })

  it('returns entity when found', async () => {
    fakeRepo.getById = async () => ({ id: 1, name: 'Test' } as EntityDto)
    const result = await service.getById(1)
    expect(result?.name).toBe('Test')
  })

  it('throws NOT_FOUND when missing', async () => {
    fakeRepo.getById = async () => undefined
    try {
      await service.handleDetail(999)
      expect(false).toBe(true)
    } catch (error: any) {
      expect(error.code).toBe('ENTITY_NOT_FOUND')
    }
  })
})
```

### Route Test Pattern

```typescript
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { errorHandler } from '@/core/http/error-handler'
import { createMockAuthPlugin } from '@/tests/helpers/auth'
import { jsonRequest } from '@/tests/helpers/http'
import { initEntityRoute } from './entity.route'
import { EntityService } from './entity.service'

function createMockService(overrides: Partial<EntityService> = {}): EntityService {
  return {
    handleList: async () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
    handleDetail: async () => ({ id: 1, name: 'Test' } as EntityDto),
    handleCreate: async () => ({ id: 1 }),
    handleUpdate: async () => ({ id: 1 }),
    handleRemove: async () => ({ id: 1 }),
    ...overrides,
  } as EntityService
}

function createTestApp(service: EntityService) {
  return new Elysia()
    .use(errorHandler)
    .use(createMockAuthPlugin())
    .use(initEntityRoute(service))
}

describe('Entity Routes', () => {
  it('GET /entity/list returns paginated response', async () => {
    const app = createTestApp(createMockService())
    const res = await app.handle(jsonRequest('GET', '/entity/list'))
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.meta).toBeDefined()
  })
})
```

### Test Helpers

See `src/tests/helpers/`:
- `auth.ts` — `createMockAuthPlugin()`, `mockAuthenticatedUser`
- `http.ts` — `createRouteTestApp()`, `jsonRequest()`
- `response.ts` — `expectSuccessResponse()`, `expectPaginatedResponse()`

---

## Error Handling

```typescript
// Throw, never return errors
throw EntityErrors.notFound(id)
throw EntityErrors.createFailed()

// Custom errors from @/core/http/errors
throw new NotFoundError('message', 'DOMAIN_CODE')
throw new ConflictError('message', 'DOMAIN_CODE')
throw new BadRequestError('message', 'DOMAIN_CODE')
throw new ForbiddenError('message', 'DOMAIN_CODE')
```

---

## Method Naming Rules

| Prefix | Who Calls | What It Does |
|--------|-----------|-------------|
| `get*()` | Other services | Cache-backed read (getById, getList, getRelationMap) |
| `handle*()` | Router ONLY | Full business logic (conflict check, cache invalidation, cross-entity ops) |
| `seed()` | SeedService | Initial data population |
| `clearCache()` | Internal only (private) | Cache invalidation after write |

---

## Golden Rules

1. **Repo** = Data access only (queries, transactions, no logic)
2. **Service** = ALL business logic (handle* for router, get* for services)
3. **Router** = HTTP only (parse, validate, call `handle*`, format response)
4. **No usecase layer** — orchestration lives in service
5. **repo is `private readonly`** — never exposed outside service
6. **clearCache is always private** — never skippable
7. **handle* called ONLY from router** — never from another service
8. **Cache invalidate on every write** — LIST, COUNT, and DETAIL(id)
9. **Use `CACHE_KEY_DEFAULT`** — standardized cache keys
10. **Batch queries over loops** — inArray() + RelationMap
11. **Every repo method wrapped in record()** for telemetry
12. **Tests co-located** — skip DTO tests, focus on service + route tests
13. **No subfolders** — co-located: dto/, entity.repo.ts, entity.service.ts, entity.route.ts, entity.test.ts

---

## See Also

- [SERVER_STANDARDS.md](./SERVER_STANDARDS.md) — Complete server coding standards
- [MODULE_CHECKLIST.md](./MODULE_CHECKLIST.md) — Module review checklist
- [ARCHITECTURE.md](./ARCHITECTURE.md) — High-level architecture overview
