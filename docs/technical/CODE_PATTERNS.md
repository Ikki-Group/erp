# 🚀 Code Patterns — Quick Reference

**Golden Path 2.0 — Backend (Simplified)**

> **Note**: For complete standards, see [SERVER_STANDARDS.md](./SERVER_STANDARDS.md)

---

## New Module Checklist

### 1️⃣ DTO

```typescript
// src/modules/feature/dto/entity.dto.ts
import { z } from 'zod'
import { zc, zp, zq } from '@/lib/validation'

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
// constants.ts — use CACHE_KEY_DEFAULT instead
// errors.ts
import { NotFoundError, InternalServerError } from '@/core/http/errors'

export const EntityErrors = {
  notFound: (id: number) => new NotFoundError(`Entity ${id} not found`, 'ENTITY_NOT_FOUND'),
  createFailed: () => new InternalServerError('Create failed', 'ENTITY_CREATE_FAILED'),
}
```

### 3️⃣ Repository

```typescript
// src/modules/feature/entity.repo.ts (co-located)
import { record } from '@elysiajs/opentelemetry'
import { and, count, eq } from 'drizzle-orm'
import { paginate, searchFilter, stampCreate, stampUpdate, takeFirst, type DbClient } from '@/core/database'
import { entityTable } from '@/db/schema'
import * as dto from './entity.dto'

export class EntityRepo {
  constructor(private readonly db: DbClient) {}

  async getById(id: number): Promise<dto.EntityDto | undefined> {
    return record('EntityRepo.getById', async () => {
      return this.db.select().from(entityTable).where(eq(entityTable.id, id)).then(takeFirst)
    })
  }

  async getList(): Promise<dto.EntityDto[]> {
    return record('EntityRepo.getList', async () => {
      return this.db.select().from(entityTable)
    })
  }

  async getListPaginated(filter: dto.EntityFilterDto) {
    return record('EntityRepo.getListPaginated', async () => {
      return paginate({
        data: ({ limit, offset }) => this.db.select().from(entityTable).limit(limit).offset(offset),
        pq: { page: filter.page, limit: filter.limit },
        countQuery: this.db.select({ count: count() }).from(entityTable),
      })
    })
  }

  async create(data: dto.EntityCreateDto, actorId: number): Promise<number | undefined> {
    return record('EntityRepo.create', async () => {
      const [res] = await this.db.insert(entityTable).values({ ...data, ...stampCreate(actorId) }).returning({ id: entityTable.id })
      return res?.id
    })
  }

  async update(data: dto.EntityUpdateDto, actorId: number): Promise<number | undefined> {
    return record('EntityRepo.update', async () => {
      const [res] = await this.db.update(entityTable).set({ ...data, ...stampUpdate(actorId) }).where(eq(entityTable.id, data.id)).returning({ id: entityTable.id })
      return res?.id
    })
  }

  async remove(id: number): Promise<number | undefined> {
    return record('EntityRepo.remove', async () => {
      const [res] = await this.db.delete(entityTable).where(eq(entityTable.id, id)).returning({ id: entityTable.id })
      return res?.id
    })
  }
}
```

### 4️⃣ Service

```typescript
// src/modules/feature/entity.service.ts (co-located)
import { record } from '@elysiajs/opentelemetry'
import { CacheService, type CacheClient } from '@/lib/cache'
import * as core from '@/core/database'
import { entityTable } from '@/db/schema'
import * as dto from './entity.dto'
import { EntityErrors } from './errors'
import { EntityRepo } from './entity.repo'

const conflictFields: core.ConflictField<'code' | 'name'>[] = [
  { field: 'code', column: entityTable.code, message: 'Code exists', code: 'ENTITY_CODE_EXISTS' },
  { field: 'name', column: entityTable.name, message: 'Name exists', code: 'ENTITY_NAME_EXISTS' },
]

export class EntityService {
  private readonly cache: CacheService

  constructor(
    private readonly repo: EntityRepo,
    cacheClient: CacheClient,
  ) {
    this.cache = new CacheService({ ns: 'entity', client: cacheClient })
  }

  /* --------------------------------- PUBLIC --------------------------------- */

  async getById(id: number): Promise<dto.EntityDto | undefined> {
    return record('EntityService.getById', async () => {
      return this.cache.getOrSetSkipUndefined({
        key: `byId:${id}`,
        factory: () => this.repo.getById(id),
      })
    })
  }

  async getList(): Promise<dto.EntityDto[]> {
    return record('EntityService.getList', async () => {
      return this.cache.getOrSet({
        key: 'list',
        factory: () => this.repo.getList(),
      })
    })
  }

  async getRelationMap(): Promise<RelationMap<number, dto.EntityDto>> {
    return record('EntityService.getRelationMap', async () => {
      const items = await this.getList()
      return RelationMap.fromArray(items, (i) => i.id)
    })
  }

  /* --------------------------------- HANDLER -------------------------------- */

  async handleDetail(id: number): Promise<dto.EntityDto> {
    return record('EntityService.handleDetail', async () => {
      const result = await this.getById(id)
      if (!result) throw EntityErrors.notFound(id)
      return result
    })
  }

  async handleList(filter: dto.EntityFilterDto): Promise<WithPaginationResult<dto.EntityDto>> {
    return record('EntityService.handleList', async () => {
      return this.repo.getListPaginated(filter)
    })
  }

  async handleCreate(data: dto.EntityCreateDto, actorId: number): Promise<{ id: number }> {
    return record('EntityService.handleCreate', async () => {
      await core.checkConflict({ table: entityTable, pkColumn: entityTable.id, fields: conflictFields, input: data })
      const id = await this.repo.create(data, actorId)
      if (!id) throw EntityErrors.createFailed()

      await this.cache.deleteMany({ keys: ['list', 'count'] })
      return { id }
    })
  }

  async handleUpdate(data: dto.EntityUpdateDto, actorId: number): Promise<{ id: number }> {
    return record('EntityService.handleUpdate', async () => {
      const existing = await this.getById(data.id)
      if (!existing) throw EntityErrors.notFound(data.id)
      await core.checkConflict({ table: entityTable, pkColumn: entityTable.id, fields: conflictFields, input: data, existing })
      await this.repo.update(data, actorId)

      await this.cache.deleteMany({ keys: ['list', 'count', `byId:${data.id}`] })
      return { id: data.id }
    })
  }

  async handleRemove(id: number): Promise<{ id: number }> {
    return record('EntityService.handleRemove', async () => {
      const result = await this.repo.remove(id)
      if (!result) throw EntityErrors.notFound(id)

      await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
      return { id }
    })
  }
}
```

### 5️⃣ Router

```typescript
// src/modules/feature/entity.route.ts (co-located)
import { Elysia } from 'elysia'
import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc, zq } from '@/lib/validation'
import * as dto from './dto/entity.dto'
import type { EntityService } from './entity.service'

export function initEntityRoute(service: EntityService) {
  return new Elysia({ prefix: '/entity' })
    .use(authPluginMacro)
    .get('/list', async ({ query }) => res.paginated(await service.handleList(query)), {
      query: dto.EntityFilterDto,
      response: createPaginatedResponseSchema(dto.EntityDto),
      auth: true,
    })
    .get('/detail', async ({ query }) => res.ok(await service.handleDetail(query.id)), {
      query: zq.recordId,
      response: createSuccessResponseSchema(dto.EntityDto),
      auth: true,
    })
    .post('/create', async ({ body, auth }) => res.ok(await service.handleCreate(body, auth.userId)), {
      body: dto.EntityCreateDto,
      response: createSuccessResponseSchema(zc.RecordId),
      auth: true,
    })
    .put('/update', async ({ body, auth }) => res.ok(await service.handleUpdate(body, auth.userId)), {
      body: dto.EntityUpdateDto,
      response: createSuccessResponseSchema(zc.RecordId),
      auth: true,
    })
    .delete('/remove', async ({ body }) => res.ok(await service.handleRemove(body.id)), {
      body: zc.RecordId,
      response: createSuccessResponseSchema(zc.RecordId),
      auth: true,
    })
}
```

### 6️⃣ Module Index

**Flat Module** (single submodule):

```typescript
// src/modules/feature/index.ts
import { Elysia } from 'elysia'
import type { DbClient } from '@/core/database'
import type { CacheClient } from '@/lib/cache'

import { EntityRepo } from './entity.repo'
import { EntityService } from './entity.service'
import { initEntityRoute } from './entity.route'

export class EntityServiceModule {
  public readonly entity: EntityService

  constructor(db: DbClient, cacheClient: CacheClient) {
    const repo = new EntityRepo(db)
    this.entity = new EntityService(repo, cacheClient)
  }
}

export function initEntityRouteModule(service: EntityServiceModule) {
  return new Elysia({ prefix: '/entity' }).use(initEntityRoute(service.entity))
}

// Export public DTOs and services for cross-module use
export {
  EntityDto,
  EntityCreateDto,
  EntityUpdateDto,
  EntityFilterDto,
} from './entity.dto'
export { EntityService } from './entity.service'
```

**Package-by-Feature** (multiple submodules):

```typescript
// src/modules/feature/index.ts
import { Elysia } from 'elysia'
import type { DbClient } from '@/core/database'
import type { CacheClient } from '@/lib/cache'

import { FeatureAService } from './feature-a/feature-a.service'
import { initFeatureARoute } from './feature-a/feature-a.route'
import { FeatureBService } from './feature-b/feature-b.service'
import { initFeatureBRoute } from './feature-b/feature-b.route'

export class FeatureServiceModule {
  public readonly featureA: FeatureAService
  public readonly featureB: FeatureBService

  constructor(db: DbClient, cacheClient: CacheClient) {
    this.featureA = new FeatureAService(db, cacheClient)
    this.featureB = new FeatureBService(db, cacheClient)
  }
}

export function initFeatureRouteModule(service: FeatureServiceModule) {
  return new Elysia({ prefix: '/feature' })
    .use(initFeatureARoute(service.featureA))
    .use(initFeatureBRoute(service.featureB))
}

export * from './feature-a/feature-a.dto'
export * from './feature-b/feature-b.dto'
export type { FeatureAService } from './feature-a/feature-a.service'
export type { FeatureBService } from './feature-b/feature-b.service'
```

### 7️⃣ Register in Registry & Routes

```typescript
// _registry.ts
import { EntityServiceModule } from './modules/entity'

const entity = new EntityServiceModule(db, cacheClient)
return { ..., entity }

// _routes.ts
import { initEntityRouteModule } from './modules/entity'

routes.push(initEntityRouteModule(modules.entity))
```

---

## Common Snippets

### Read with Cache

```typescript
async getById(id: number): Promise<dto.EntityDto | undefined> {
  return this.cache.getOrSetSkipUndefined({
    key: `byId:${id}`,
    factory: () => this.repo.getById(id),
  })
}

async getList(): Promise<dto.EntityDto[]> {
  return this.cache.getOrSet({
    key: 'list',
    factory: () => this.repo.getList(),
  })
}
```

### Batch Invalidation

```typescript
// In mutation handlers — invalidate immediately
async handleCreate(data, actorId) {
  const id = await this.repo.create(data, actorId)
  await this.cache.deleteMany({ keys: ['list', 'count'] })
  return { id }
}

async handleUpdate(data, actorId) {
  await this.repo.update(data, actorId)
  await this.cache.deleteMany({ keys: ['list', 'count', `byId:${data.id}`] })
  return { id: data.id }
}

async handleRemove(id) {
  await this.repo.remove(id)
  await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
  return { id }
}
```

### In-memory Join (RelationMap)

```typescript
const [items, roleMap, locationMap] = await Promise.all([
  this.repo.getList(),
  roleService.getRelationMap(),
  locationService.getRelationMap(),
])
```


### Lazy Injection (Cross-Module)

```typescript
export class UserService {
  constructor(
    private readonly repo = new UserRepo(),
    private readonly getRoleService?: () => RoleService,
    private readonly getLocationService?: () => LocationMasterService,
  ) {}

  private async buildDetail(user: UserDto) {
    const roleService = this.getRoleService!()
    const locationService = this.getLocationService!()
    // ...
  }
}

const role = new RoleService()
const user = new UserService(undefined, () => role, () => this.getExternalModules().location.location)
```

---

## Testing Patterns

### Testing

```
modules/location/location-master/
├── location-master.service.ts
├── location-master.service.test.ts   # co-located
├── location-master.route.ts
├── location-master.route.test.ts     # co-located
```

❌ Skip DTO tests — Zod validated via routes.

```typescript
// Service test
function createFakeRepo(overrides = {}): EntityRepo {
  return { getById: async () => undefined, getList: async () => [], ...overrides } as EntityRepo
}

beforeEach(() => {
  fakeRepo = createFakeRepo()
  service = new EntityService(fakeRepo)  // inject fake repo
})

// Route test
function createMockService(overrides = {}): EntityService {
  return { handleList: async () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }), ...overrides } as EntityService
}

function createTestApp(service: EntityService) {
  return new Elysia().use(errorHandler).use(createMockAuthPlugin()).use(initEntityRoute(service))
}
```

Test helpers: `src/tests/helpers/` — auth.ts, http.ts, response.ts

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

1. **Repo** = Data access only (queries, transactions, no logic, NO caching)
2. **Service** = ALL business logic + caching (handle* for router, get* for services)
3. **Router** = HTTP only (parse, validate, call `handle*`, format response)
4. **No usecase layer** — orchestration lives in service
5. **repo is `private readonly`** — never exposed outside service
6. **handle* called ONLY from router** — never from another service
7. **Cache at service layer** — use `CacheService` from `@/lib/cache`
8. **Cache invalidate on every write** — LIST, COUNT, and DETAIL(id)
9. **Use namespace cache** — `new CacheService({ ns: 'entity', client })`
10. **Batch queries over loops** — inArray() + RelationMap
11. **Every repo method wrapped in record()** for telemetry
12. **Tests co-located** — skip DTO tests, focus on service + route tests
13. **Flat structure for single submodule** — co-located files, no nested folders
14. **Package-by-feature for multiple submodules** — subfolder per feature with index.ts

---

## See Also

- [SERVER_STANDARDS.md](./SERVER_STANDARDS.md) — Complete server coding standards
- [MODULE_CHECKLIST.md](./MODULE_CHECKLIST.md) — Module review checklist
- [ARCHITECTURE.md](./ARCHITECTURE.md) — High-level architecture overview
