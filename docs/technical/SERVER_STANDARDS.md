# Server Coding Standards — Ikki ERP

> **Scope**: `apps/server` — Bun + Elysia + Drizzle + PostgreSQL  
> **Audience**: Developers, AI agents, code reviewers  
> **Last Updated**: 2026-04-28

---

## 1. Module Structure

```
src/modules/{name}/
├── dto/
│   └── {entity}.dto.ts       # Zod schemas only
├── {entity}.repo.ts          # Drizzle queries, NO business logic
├── {entity}.service.ts       # Business logic + cache
├── {entity}.route.ts         # HTTP handlers
├── {entity}.service.test.ts  # Service unit tests
├── {entity}.route.test.ts    # Route/API tests
├── constants.ts              # Cache keys, config
├── errors.ts                 # Domain errors (optional)
└── index.ts                  # PUBLIC API: Module + Services ONLY
```

### Rules
- **NO `export *`** from root `index.ts` — only export `XxxModule` and `XxxServices`
- **NO `usecase/` folder** — orchestration lives in service layer
- **NO `router/` subfolder** — route file co-located with service
- **NO `repo/` subfolder** — repo file co-located with service
- **NO `dto/` barrel exports** — import DTOs directly from `dto/entity.dto.ts`

---

## 2. Service Layer Standards

### Constructor DI Pattern

```typescript
export class EntityService {
  // ✅ repo is private readonly — never exposed
  constructor(private readonly repo = new EntityRepo()) {}

  // ✅ cross-module deps via lazy getter (if needed)
  constructor(
    private readonly repo = new EntityRepo(),
    private readonly getOtherService?: () => OtherService,
  ) {}
}
```

### Method Naming Convention

| Prefix | Caller | Responsibility |
|--------|--------|----------------|
| `get*()` | Other services | Cache-backed reads (getById, getList, getRelationMap) |
| `handle*()` | Router ONLY | Full business logic + cache invalidation |
| `seed()` | SeedService | Initial data population |
| `clearCache()` | Internal (private) | Cache invalidation — never public |

### Service Template

```typescript
import { record } from '@elysiajs/opentelemetry'
import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import { logger } from '@/core/logger'
import * as core from '@/core/database'
import { entityTable } from '@/db/schema'
import * as dto from './entity.dto'
import { EntityErrors } from './errors'
import { EntityRepo } from './entity.repo'

const ENTITY_CACHE_NAMESPACE = 'entity'

const conflictFields: core.ConflictField<'code'>[] = [
  { field: 'code', column: entityTable.code, message: 'Code exists', code: 'ENTITY_CODE_EXISTS' },
]

export class EntityService {
  private readonly cache: CacheProvider

  constructor(
    private readonly repo = new EntityRepo(),
    cacheClient: CacheClient,
  ) {
    this.cache = cacheClient.namespace(ENTITY_CACHE_NAMESPACE)
  }

  /* --------------------- QUERY (public) --------------------- */

  async getById(id: number): Promise<dto.EntityDto | undefined> {
    return record('EntityService.getById', async () => {
      return this.cache.getOrSet({
        key: CACHE_KEY_DEFAULT.byId(id),
        factory: async ({ skip }) => (await this.repo.getById(id)) ?? skip(),
      })
    })
  }

  async getList(): Promise<dto.EntityDto[]> {
    return record('EntityService.getList', async () => {
      return this.cache.getOrSet({ key: CACHE_KEY_DEFAULT.list, factory: () => this.repo.getList() })
    })
  }

  /* --------------------- HANDLERS (router only) --------------------- */

  async handleDetail(id: number): Promise<dto.EntityDto> {
    return record('EntityService.handleDetail', async () => {
      const result = await this.getById(id)
      if (!result) throw EntityErrors.notFound(id)
      return result
    })
  }

  async handleCreate(data: dto.EntityCreateDto, actorId: number): Promise<{ id: number }> {
    return record('EntityService.handleCreate', async () => {
      await core.checkConflict({ table: entityTable, pkColumn: entityTable.id, fields: conflictFields, input: data })
      const id = await this.repo.create(data, actorId)
      if (!id) throw EntityErrors.createFailed()
      this.clearCacheAsync()
      return { id }
    })
  }

  async handleUpdate(data: dto.EntityUpdateDto, actorId: number): Promise<{ id: number }> {
    return record('EntityService.handleUpdate', async () => {
      const existing = await this.getById(data.id)
      if (!existing) throw EntityErrors.notFound(data.id)
      await core.checkConflict({ table: entityTable, pkColumn: entityTable.id, fields: conflictFields, input: data, existing })
      await this.repo.update(data, actorId)
      this.clearCacheAsync(data.id)
      return { id: data.id }
    })
  }

  async handleRemove(id: number): Promise<{ id: number }> {
    return record('EntityService.handleRemove', async () => {
      const existing = await this.getById(id)
      if (!existing) throw EntityErrors.notFound(id)
      await this.repo.remove(id)
      this.clearCacheAsync(id)
      return { id }
    })
  }

  /* --------------------- PRIVATE --------------------- */

  private async clearCache(id?: number): Promise<void> {
    const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
    if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
    await this.cache.deleteMany({ keys })
  }

  private clearCacheAsync(id?: number): void {
    void this.clearCache(id).catch((error: unknown) => {
      logger.error(error, 'EntityService cache invalidation failed')
    })
  }
}
```

---

## 3. Repository Layer Standards

```typescript
import { record } from '@elysiajs/opentelemetry'
import { eq, count } from 'drizzle-orm'
import { takeFirst, stampCreate, stampUpdate, paginate } from '@/core/database'
import type { DbClient } from '@/core/database'
import { CACHE_KEY_DEFAULT, type CacheClient, type CacheProvider } from '@/core/cache'
import { logger } from '@/core/logger'
import { entityTable } from '@/db/schema'
import * as dto from './entity.dto'

const ENTITY_CACHE_NAMESPACE = 'entity'

export class EntityRepo {
  private readonly db: DbClient
  private readonly cache: CacheProvider

  constructor(db: DbClient, cacheClient: CacheClient) {
    this.db = db
    this.cache = cacheClient.namespace(ENTITY_CACHE_NAMESPACE)
  }

  /* --------------------- QUERY --------------------- */

  async getById(id: number): Promise<dto.EntityDto | undefined> {
    return record('EntityRepo.getById', async () => {
      return this.cache.getOrSet({
        key: CACHE_KEY_DEFAULT.byId(id),
        factory: async ({ skip }) => {
          const res = await this.db.select().from(entityTable).where(eq(entityTable.id, id)).then(takeFirst)
          return res ?? skip()
        },
      })
    })
  }

  async getList(): Promise<dto.EntityDto[]> {
    return record('EntityRepo.getList', async () => {
      return this.cache.getOrSet({
        key: CACHE_KEY_DEFAULT.list,
        factory: async () => this.db.select().from(entityTable),
      })
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

  /* --------------------- MUTATION --------------------- */

  async create(data: dto.EntityCreateDto, actorId: number): Promise<number | undefined> {
    return record('EntityRepo.create', async () => {
      const [res] = await this.db.insert(entityTable).values({ ...data, ...stampCreate(actorId) }).returning({ id: entityTable.id })
      this.clearCacheAsync()
      return res?.id
    })
  }

  async update(data: dto.EntityUpdateDto, actorId: number): Promise<number | undefined> {
    return record('EntityRepo.update', async () => {
      const [res] = await this.db
        .update(entityTable)
        .set({ ...data, ...stampUpdate(actorId) })
        .where(eq(entityTable.id, data.id))
        .returning({ id: entityTable.id })
      this.clearCacheAsync(data.id)
      return res?.id
    })
  }

  async remove(id: number): Promise<number | undefined> {
    return record('EntityRepo.remove', async () => {
      const [res] = await this.db.delete(entityTable).where(eq(entityTable.id, id)).returning({ id: entityTable.id })
      this.clearCacheAsync(id)
      return res?.id
    })
  }

  /* --------------------- PRIVATE --------------------- */

  #clearCache(id?: number): Promise<void> {
    return record('EntityRepo.#clearCache', async () => {
      const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
      if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
      await this.cache.deleteMany({ keys })
    })
  }

  #clearCacheAsync(id?: number): void {
    void this.#clearCache(id).catch((error: unknown) => {
      logger.error(error, 'EntityRepo cache invalidation failed')
    })
  }
}
```

### Rules
- Wrap every method with `record('ClassName.methodName', ...)`
- Inject `CacheClient` via constructor, create namespaced cache with `namespace()`
- Use `CacheProvider` type for namespaced cache
- Define namespace constant (e.g., `ENTITY_CACHE_NAMESPACE`) to avoid typos
- Use `#clearCacheAsync()` for fire-and-forget invalidation with error handling
- NO business logic in repo
- Use `stampCreate()` / `stampUpdate()` for audit columns

---

## 4. Route Layer Standards

```typescript
import { Elysia } from 'elysia'
import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc, zq } from '@/core/validation'
import * as dto from './entity.dto'
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

### Rules
- Router calls ONLY `handle*()` methods — never `get*()`
- Named inner functions: `async function create({ body, auth }) { ... }`
- Use `res.ok()` for single items, `res.paginated()` for lists
- Always set `auth: true` for protected endpoints

---

## 5. Cache Standards

### Cache DI Pattern

**Cache is injected via `CacheClient` at module level, not imported globally.**

```typescript
// In module registry (root level)
const cacheClient = createCache()

// In module constructor
constructor(
  private readonly db: DbClient,
  private readonly cacheClient: CacheClient,
  private readonly deps: ModuleDeps,
) {
  // Pass to repos
  this.entity = new EntityRepo(this.db, this.cacheClient)
}
```

### Use `CACHE_KEY_DEFAULT` (Standardized)

```typescript
import { CACHE_KEY_DEFAULT } from '@/core/cache'

// Keys:
CACHE_KEY_DEFAULT.list           // 'list'
CACHE_KEY_DEFAULT.count          // 'count'
CACHE_KEY_DEFAULT.byId(123)      // 'byId:123'
```

### Cache Pattern in Repo

```typescript
const ENTITY_CACHE_NAMESPACE = 'entity'

export class EntityRepo {
  private readonly cache: CacheProvider

  constructor(db: DbClient, cacheClient: CacheClient) {
    this.db = db
    this.cache = cacheClient.namespace(ENTITY_CACHE_NAMESPACE)
  }

  // Read with fallback
  async getById(id: number) {
    return this.cache.getOrSet({
      key: CACHE_KEY_DEFAULT.byId(id),
      factory: async ({ skip }) => {
        const res = await this.db.select().from(entityTable).where(eq(entityTable.id, id)).then(takeFirst)
        return res ?? skip()
      },
    })
  }

  // Fire-and-forget invalidation with error handling
  #clearCache(id?: number): Promise<void> {
    return record('EntityRepo.#clearCache', async () => {
      const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
      if (id !== undefined) keys.push(CACHE_KEY_DEFAULT.byId(id))
      await this.cache.deleteMany({ keys })
    })
  }

  #clearCacheAsync(id?: number): void {
    void this.#clearCache(id).catch((error: unknown) => {
      logger.error(error, 'EntityRepo cache invalidation failed')
    })
  }
}
```

### Cache Pattern in Service

```typescript
export class EntityService {
  private readonly cache: CacheProvider

  constructor(
    private readonly repo = new EntityRepo(),
    cacheClient: CacheClient,
  ) {
    this.cache = cacheClient.namespace(ENTITY_CACHE_NAMESPACE)
  }

  private clearCacheAsync(id?: number): void {
    void this.clearCache(id).catch((error: unknown) => {
      logger.error(error, 'EntityService cache invalidation failed')
    })
  }
}
```

---

## 6. Testing Standards

### Test File Locations (Co-located)

```
modules/location/location-master/
├── location-master.service.ts
├── location-master.service.test.ts   # ← service tests
├── location-master.route.ts
├── location-master.route.test.ts     # ← route tests
```

### Skip DTO Tests

❌ **Don't test DTO parsing** — Zod validation is tested implicitly via route tests.

✅ **Focus testing on**: Service logic, Route handlers, Integration flows

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
    service = new EntityService(fakeRepo)  // inject fake repo
  })

  it('returns entity when found', async () => {
    fakeRepo.getById = async () => ({ id: 1, name: 'Test' } as EntityDto)
    const result = await service.getById(1)
    expect(result?.name).toBe('Test')
  })

  it('throws ENTITY_NOT_FOUND when missing', async () => {
    fakeRepo.getById = async () => undefined
    try {
      await service.handleDetail(999)
      expect(false).toBe(true) // should not reach here
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
  it('GET /list returns paginated response', async () => {
    const app = createTestApp(createMockService())
    const res = await app.handle(jsonRequest('GET', '/entity/list'))
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.meta).toBeDefined()
  })
})
```

### Test Helpers

Located in `src/tests/helpers/`:

| Helper | Purpose |
|--------|---------|
| `auth.ts` | `createMockAuthPlugin()`, `mockAuthenticatedUser` |
| `http.ts` | `createRouteTestApp()`, `jsonRequest()` |
| `response.ts` | `expectSuccessResponse()`, `expectPaginatedResponse()` |
| `cache.ts` | `createTestCache()`, `clearTestCache()` |

---

## 7. Error Handling Standards

```typescript
// errors.ts
import { NotFoundError, InternalServerError, BadRequestError } from '@/core/http/errors'

export const EntityErrors = {
  notFound: (id: number) => new NotFoundError(`Entity ${id} not found`, 'ENTITY_NOT_FOUND'),
  createFailed: () => new InternalServerError('Create failed', 'ENTITY_CREATE_FAILED'),
}
```

### Rules
- Services throw errors — never return null/undefined for error conditions
- Router does NOT catch errors — let framework handle via `errorHandler`
- Error code format: `DOMAIN_ACTION_DETAIL` (e.g., `USER_CREATE_FAILED`)

---

## 8. Golden Rules Summary

1. **Repo = Data access only** — no logic, no cache
2. **Service = ALL business logic** — `handle*` for router, `get*` for services
3. **Router = HTTP only** — parse, validate, call `handle*`, format response
4. **No usecase layer** — orchestration lives in service
5. **repo is always `private readonly`** — never exposed outside service
6. **clearCache is always `private`** — never skippable from outside
7. **handle* called ONLY from router** — never from another service
8. **Cache invalidate on every write** — LIST, COUNT, DETAIL(id)
9. **Use `CACHE_KEY_DEFAULT`** — standardized cache keys
10. **Every repo/service method wrapped in `record()`** — telemetry
11. **Tests co-located** — skip DTO tests, focus on service + route

---

## 9. Anti-Patterns (Avoid)

```typescript
// ❌ Router calling get*() directly
await service.getById(id)  // Wrong! Use handleDetail()

// ❌ Repo exposed publicly
constructor(public repo: EntityRepo) {}  // Wrong! Use private readonly

// ❌ clearCache is public
public async clearCache() {}  // Wrong! Must be private

// ❌ Root index exports everything
export * from './dto'  // Wrong! Only export Module

// ❌ DTO tests — too rigid, maintenance burden
// Skip these — Zod validation tested via routes

// ❌ Usecase layer for simple CRUD
// Use service directly — only use orchestration when cross-module

// ❌ Custom cache keys
key: `entity:${id}`  // Wrong! Use CACHE_KEY_DEFAULT.byId(id)
```

---

## 10. Module Index Template

```typescript
// index.ts — PUBLIC API ONLY
import { EntityService } from './entity.service'

export interface EntityServices {
  entity: EntityService
}

export class EntityModule {
  public readonly service: EntityServices

  constructor() {
    this.service = { entity: new EntityService() }
  }
}

// ❌ NEVER do this:
// export * from './dto'
// export * from './entity.service'
// export * from './entity.route'
```

---

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Full architecture deep dive
- [CODE_PATTERNS.md](./CODE_PATTERNS.md) — Snippets and common patterns
- [MODULE_CHECKLIST.md](./MODULE_CHECKLIST.md) — Review checklist for modules
