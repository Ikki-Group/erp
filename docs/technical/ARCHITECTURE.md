# Backend Architecture — Golden Path 2.1

> Full standards: [SERVER_STANDARDS.md](./SERVER_STANDARDS.md) | Patterns: [CODE_PATTERNS.md](./CODE_PATTERNS.md) | Checklist: [MODULE_CHECKLIST.md](./MODULE_CHECKLIST.md)

## Quick Summary

| Aspect | Standard |
|--------|----------|
| Structure | Flat for single submodule, package-by-feature for multiple |
| DI | `private readonly repo` + `CacheService` constructor injection |
| Cache | `CacheService` from `@/lib/cache` — namespace isolation in service layer |
| Service Methods | `get*()` for cross-service reads, `handle*()` for router |
| Testing | Co-located tests, skip DTO tests, mock via DI |
| No Usecase | Orchestration in service layer |

---

## Module Layering

### Dependency Graph

```
Layer 3 (Aggregators): dashboard, moka, tool (depends on all)
Layer 2 (Operations): inventory, recipe, sales, purchasing (depends on Layer 0-1)
Layer 1.5 (Security): auth (depends on iam)
Layer 1 (Master Data): iam, material, supplier, employee, finance (depends on location)
Layer 0 (Core): location, product (no dependencies)
```

### Rules

- Unidirectional imports (no upward)
- No circular deps (`bun run check-deps`)
- Shared kernel: `src/core/`
- Lazy injection: `() => dep` for cross-module to avoid circular bootstrap

### Module Structure

**Flat Module** (single submodule):

```
src/modules/{name}/
├── index.ts              # ServiceModule + initRouteModule
├── {name}.dto.ts
├── {name}.repo.ts
├── {name}.service.ts
├── {name}.route.ts
├── {name}.service.test.ts
└── {name}.route.test.ts
```

**Package-by-Feature** (multiple submodules):

```
src/modules/{name}/
├── index.ts              # ServiceModule + initRouteModule + re-exports
├── feature-a/
│   ├── index.ts
│   ├── feature-a.dto.ts
│   ├── feature-a.repo.ts
│   ├── feature-a.service.ts
│   └── feature-a.route.ts
├── feature-b/
│   ├── index.ts
│   └── ...
├── constants.ts
└── errors.ts
```

---
## Layer Architecture

### Data Flow

```
HTTP Client → Router → Service → Repo → DB
```

- **Router**: Parse/validate (Zod), check auth, call `service.handle*()`, format response
- **Service**: Business rules, uniqueness check, cache, cross-entity orchestration
- **Repo**: Queries, mutations, transactions

### Method Naming

| Prefix | Caller | Responsibility |
|--------|--------|----------------|
| `get*()` | Other services | Cache-backed reads |
| `handle*()` | Router ONLY | Full business logic + cache invalidation |
| `clearCache()` | Internal (private) | Cache invalidation |

### Dependency Injection

- Constructor injection with `private readonly repo` and `private readonly cacheClient`
- Cross-module: lazy getter `() => dep` (avoid circular bootstrap)
- Module class as DI container
- Cache initialized at root registry via `createCache()`, injected to modules

## Repository Layer

- NO business logic, NO caching (cache moved to service layer)
- Every method wrapped with `record('ClassName.methodName', ...)`
- Batch queries with `inArray()`, not loops
- Use `paginate()`, `searchFilter()` from `@/core/database`
- `stampCreate()`, `stampUpdate()` for audit columns
- Multi-step mutations use `db.transaction()`

## Caching Strategy

- Cache implemented in **service layer** (not repo)
- Use `CacheService` from `@/lib/cache` with namespace isolation
- Initialize: `new CacheService({ ns: 'entity', client: cacheClient })`
- Read methods use `cache.getOrSet()` or `cache.getOrSetSkipUndefined()`
- Mutation methods invalidate cache immediately with `cache.deleteMany({ keys: [...] })`
- Cache keys: simple strings like `'list'`, `'count'`, `` `byId:${id}` ``
- Invalidate pattern: `['list', 'count']` for create, add `` `byId:${id}` `` for update/delete

## Error Handling

- Services throw errors (never return null/undefined for errors)
- Error factories in `errors.ts` (e.g., `EntityErrors.notFound(id)`)
- Route handlers NO try/catch (let framework handle via `errorHandler`)

## Validation Strategy

- All routes have typed `body`/`query` with DTO
- CREATE: `checkConflict({ input: data })` without `existing`
- UPDATE: `checkConflict({ input: data, existing })` with `existing`
- `conflictFields` at module-level constant

## HTTP & Router Layer

- `initXxxRoute(service)` function, co-located file
- Router calls ONLY `service.handle*()` — never `get*()`
- Endpoints: GET /list, GET /detail, POST /create, PUT /update, DELETE /remove
- Response: `res.paginated()` for lists, `res.ok()` for single
- Protected endpoints have `auth: true`, use `auth.userId` as `actorId`
      async function remove({ body }) {
        const result = await service.handleRemove(body.id)
        return res.ok(result)
      },
      { body: zc.RecordId, response: createSuccessResponseSchema(zc.RecordId), auth: true },
    )
}
```

### Route Assembly

```typescript
// modules/entity/index.ts
export class EntityServiceModule {
  public readonly entity: EntityService

  constructor(db: DbClient, cacheClient: CacheClient) {
    const repo = new EntityRepo(db)
    this.entity = new EntityService(repo, cacheClient)
  }
}

export function initEntityRouteModule(service: EntityServiceModule) {
  return new Elysia({ prefix: '/entity' })
    .use(initEntityRoute(service.entity))
}

// _routes.ts
import { initEntityRouteModule } from './modules/entity'
routes.push(initEntityRouteModule(modules.entity))
```

### Response Builders

```typescript
res.ok(data)           // { success: true, data }
res.paginated(result)  // { success: true, data: [...], meta: { total, page, limit, pages } }
```

### Endpoint Naming Convention

| HTTP Method | Path | Handler | Keterangan |
|-------------|------|---------|------------|
| GET | `/list` | `handleList(filter)` | Paginated list |
| GET | `/detail` | `handleDetail(id)` | Single record |
| POST | `/create` | `handleCreate(data, actorId)` | Create record |
| PUT | `/update` | `handleUpdate(id, data, actorId)` | Update record |
| DELETE | `/remove` | `handleRemove(id)` | Delete record |

---

## Database Layer

### Schema Conventions

```typescript
export const entitiesTable = pgTable('entities', {
  id: serial().primaryKey(),
  // ... entity fields ...
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
  createdBy: integer().references(() => usersTable.id).notNull(),
  updatedBy: integer().references(() => usersTable.id).notNull(),
})
```

### Migration Workflow

```bash
# 1. Edit src/db/schema.ts
# 2. Generate migration
bun run db:generate

# 3. Review generated SQL di src/db/migrations/
# 4. Apply
bun run db:migrate

# 5. Commit schema.ts + migration file bersama
```

### Query Patterns

```typescript
// N+1 prevention — gunakan inArray()
const users = await db.select().from(usersTable).where(inArray(usersTable.id, ids))

// In-memory join — gunakan RelationMap
const roleMap = RelationMap.fromArray(roles, r => r.id)
const enriched = items.map(item => ({ ...item, role: roleMap.getRequired(item.roleId) }))

// Parallel queries
const [roleMap, locationMap] = await Promise.all([
  roleService.getRelationMap(),
  locationService.getRelationMap(),
])
```

---

## Authentication & Authorization

```typescript
// Router: tambahkan auth: true untuk endpoint yang dilindungi
.get('/detail', handler, { auth: true, query: ... })

// Service/Handler: gunakan actorId dari auth context
async function create({ body, auth }) {
  const result = await service.handleCreate(body, auth.userId)
  return res.ok(result)
}
```

---

## Telemetry & Observability

Setiap method di repo dan service di-wrap dengan `record()`:

```typescript
import { record } from '@elysiajs/opentelemetry'

async getById(id: number) {
  return record('EntityRepo.getById', async () => {
    return db.select().from(entityTable).where(eq(entityTable.id, id)).then(r => r[0])
  })
}
```

Naming convention: `'ClassName.methodName'` — konsisten agar mudah dicari di trace viewer.
