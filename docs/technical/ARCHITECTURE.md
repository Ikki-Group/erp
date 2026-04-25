# 🏛️ Backend Architecture — Golden Path 2.1

**Last Updated:** 2026-04-26  
**Status:** Production-Ready  
**Audience:** Developers, AI Agents, Code Reviewers

---

## Table of Contents

1. [Overview](#overview)
2. [Module Layering](#module-layering)
3. [Layer Architecture: Router → Service → Repo](#layer-architecture)
4. [Service Method Naming Convention](#service-method-naming-convention)
5. [Dependency Injection Pattern](#dependency-injection-pattern)
6. [Barrel Import Policy](#barrel-import-policy)
7. [Repository Layer](#repository-layer)
8. [Caching Strategy](#caching-strategy)
9. [Error Handling](#error-handling)
10. [Validation Strategy](#validation-strategy)
11. [HTTP & Router Layer](#http--router-layer)
12. [Database Layer](#database-layer)
13. [Authentication & Authorization](#authentication--authorization)
14. [Telemetry & Observability](#telemetry--observability)

---

## Overview

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Bun | Fast JavaScript runtime with native TypeScript |
| **Web Framework** | Elysia | Type-safe REST API framework |
| **Database** | PostgreSQL | Relational data storage |
| **ORM** | Drizzle | Type-safe query builder |
| **Validation** | Zod | Runtime type validation |
| **Caching** | BentoCache | In-memory/distributed cache |
| **Logging** | Pino | High-performance JSON logging |
| **Monitoring** | OpenTelemetry | Observability and tracing |

### Design Philosophy

- **Simplicity First**: Satu service file per entity. Tidak ada layer tambahan (no usecase layer, no facade).
- **Type Safety**: Strict TypeScript + Zod validation di boundaries.
- **Clear Naming Convention**: Method prefix (`get*`, `handle*`) menggantikan layer separation sebagai penanda tanggung jawab.
- **Performance-Conscious**: Batch operations, caching, parallel queries.
- **No Premature Abstraction**: Hanya tambah abstraksi jika ada kebutuhan nyata yang konkret.

---

## Module Layering

### Dependency Graph

```
Layer 3 (Aggregators)
├── production   (depends on: recipe, inventory, location, iam)
├── hr           (depends on: employee, location, iam)
├── dashboard    (depends on: all layers)
├── moka         (depends on: sales, product, location)
└── tool         (depends on: all layers)
          ↓
Layer 2 (Operations)
├── inventory    (depends on: product, location, iam)
├── recipe       (depends on: product, location)
├── sales        (depends on: product, location, iam)
└── purchasing   (depends on: supplier, product, location)
          ↓
Layer 1.5 (Security)
└── auth         (depends on: iam)
          ↓
Layer 1 (Master Data)
├── iam          (depends on: location)
├── material     (depends on: location)
├── supplier     (depends on: location)
├── employee     (depends on: location)
└── finance      (depends on: location)
          ↓
Layer 0 (Core)
├── location     (no dependencies)
└── product      (no dependencies)
```

### Layering Rules

1. **Unidirectional Imports**: Layer N hanya boleh mengimport dari layer N-1, N-2, dst (tidak boleh ke atas).
2. **No Circular Dependencies**: Cek dengan `bun run check-deps`.
3. **Shared Kernel**: `src/core/` tersedia untuk semua layer.
4. **Lazy Injection untuk Cross-Module**: Gunakan getter function `() => module` jika diperlukan untuk menghindari circular dependency saat bootstrap.

### Module Structure

```
src/modules/{name}/
├── dto/
│   ├── index.ts              # Barrel (internal convenience)
│   └── {entity}.dto.ts       # Zod schemas
├── repo/
│   ├── index.ts              # Barrel (internal convenience)
│   └── {entity}.repo.ts      # Drizzle queries, no logic
├── service/
│   ├── index.ts              # Barrel (internal convenience)
│   └── {entity}.service.ts   # All business logic
├── router/
│   ├── index.ts              # Route assembly + initXxxRouteModule()
│   └── {entity}.route.ts     # HTTP handlers
├── constants.ts              # Cache keys, config constants
├── errors.ts                 # Domain error factories (optional)
└── index.ts                  # PUBLIC API: exports Module class only
```

---

## Layer Architecture

### Data Flow

```
HTTP Client
    ↓
Router (HTTP Handler)
  - Parse & validate input (Zod)
  - Check auth
  - Call service.handle*()
  - Format response
    ↓
Service (Business Logic — SINGLE LAYER)
  - Implement business rules
  - Validate uniqueness (checkConflict)
  - Manage cache (get/invalidate)
  - Orchestrate cross-entity operations
  - Lazy-inject cross-module dependencies
  - Throw domain errors
    ↓
Repository (Data Access)
  - Build Drizzle queries
  - Manage transactions
  - Wrap with record() for telemetry
  - No business logic, no caching
    ↓
Database (PostgreSQL)
```

> **Tidak ada Usecase layer.** Orkestrasi lintas entity (misalnya: create User + Assignments) diselesaikan di dalam Service, bukan di layer terpisah.

### Request Flow Example

```typescript
// 1. HTTP Request
POST /api/iam/user/create
{ "email": "john@example.com", "username": "john", "assignments": [...] }

// 2. Router — hanya memanggil service.handle*()
async function create({ body, auth }) {
  const result = await service.handleCreate(body, auth.userId)
  return res.ok(result)
}

// 3. Service — semua logika ada di sini
async handleCreate(data: UserCreateDto, actorId: number) {
  const passwordHash = await Bun.password.hash(data.password)

  await checkConflict({ table: usersTable, fields: userConflictFields, input: data })

  const insertedId = await this.repo.create({ ...data, passwordHash }, actorId)

  // Cross-entity orchestration: assignment (sama-sama di dalam module ini)
  if (data.assignments?.length) {
    const assignmentService = this.getAssignmentService!()
    await assignmentService.handleReplaceBulkByUserId(insertedId, data.assignments, actorId)
  }

  await this.clearCache()
  return { id: insertedId }
}

// 4. Repo — hanya query
async create(data, actorId) {
  return record('UserRepo.create', async () => {
    return db.insert(usersTable).values({ ...data, createdBy: actorId, updatedBy: actorId })
      .returning({ id: usersTable.id }).then(r => r[0]?.id)
  })
}
```

---

## Service Method Naming Convention

Ini adalah **aturan penamaan paling penting** di arsitektur ini. Method name menentukan siapa caller-nya.

| Prefix | Caller | Tanggung Jawab |
|--------|--------|----------------|
| `get*()` | Service lain, internal | Cache-backed query. Contoh: `getById()`, `getList()`, `getRelationMap()` |
| `handle*()` | Router **saja** | Full business logic: conflict check, cache invalidation, cross-entity ops. Contoh: `handleCreate()`, `handleList()`, `handleDetail()` |
| `seed()` | SeedService | Operasi inisialisasi data awal |
| `private clearCache()` | Internal service | Cache invalidation — **selalu private** |
| `private buildUserAssignments()` | Internal service | Helper enrichment — **selalu private** |

### Rules

1. **Router HANYA boleh memanggil `handle*()`** — tidak boleh memanggil `get*()` langsung.
2. **Service lain boleh memanggil `get*()`** — untuk fetch data yang di-cache.
3. **`clearCache()` SELALU private** — memastikan cache invalidation tidak bisa di-skip dari luar.
4. **`repo` SELALU private** — memastikan semua akses data melalui service.

```typescript
// ❌ SALAH — router memanggil get*() langsung
async function detail({ query }) {
  const user = await service.getById(query.id) // ← jangan begini!
  return res.ok(user)
}

// ✅ BENAR — router selalu pakai handle*()
async function detail({ query }) {
  const result = await service.handleDetail(query.id)
  return res.ok(result)
}
```

### Service Class Template

```typescript
import { record } from '@elysiajs/opentelemetry'
import { bento } from '@/core/cache'
import * as core from '@/core/database'
import { entityTable } from '@/db/schema'
import { ENTITY_CACHE_KEYS } from '../constants'
import * as dto from '../dto/entity.dto'
import { EntityErrors } from '../errors'
import { EntityRepo } from '../repo/entity.repo'

const cache = bento.namespace('entity')

const entityConflictFields: core.ConflictField<'code' | 'name'>[] = [
  {
    field: 'code',
    column: entityTable.code,
    message: 'Code already exists',
    code: 'ENTITY_CODE_EXISTS',
  },
]

export class EntityService {
  // repo selalu private
  constructor(private repo = new EntityRepo()) {}

  /* ================================================================== */
  /*  CACHE MANAGEMENT (always private)                                  */
  /* ================================================================== */

  private async clearCache(id?: number): Promise<void> {
    const keys = [ENTITY_CACHE_KEYS.LIST, ENTITY_CACHE_KEYS.COUNT]
    if (id) keys.push(ENTITY_CACHE_KEYS.DETAIL(id))
    await cache.deleteMany({ keys })
  }

  /* ================================================================== */
  /*  QUERY OPERATIONS — get*() — callable by other services            */
  /* ================================================================== */

  async getList(): Promise<dto.EntityDto[]> {
    return record('EntityService.getList', async () => {
      return cache.getOrSet({
        key: ENTITY_CACHE_KEYS.LIST,
        factory: async () => this.repo.getList(),
      })
    })
  }

  async getById(id: number): Promise<dto.EntityDto | undefined> {
    return record('EntityService.getById', async () => {
      return cache.getOrSet({
        key: ENTITY_CACHE_KEYS.DETAIL(id),
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
        key: ENTITY_CACHE_KEYS.COUNT,
        factory: () => this.repo.count(),
      })
    })
  }

  /* ================================================================== */
  /*  SEED OPERATION                                                      */
  /* ================================================================== */

  async seed(data: (dto.EntityCreateDto & { createdBy: number })[]): Promise<void> {
    await this.repo.seed(data)
    await this.clearCache()
  }

  /* ================================================================== */
  /*  HANDLER OPERATIONS — handle*() — callable by Router ONLY          */
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
        fields: entityConflictFields,
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
        fields: entityConflictFields,
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

---

## Dependency Injection Pattern

### Standard Module (No Cross-Module Deps)

```typescript
// Simple: service instantiates its own repo
export class LocationMasterService {
  constructor(private repo = new LocationMasterRepo()) {}
}

export class LocationServiceModule {
  public location: LocationMasterService
  constructor() {
    this.location = new LocationMasterService()
  }
}
```

### Module with Cross-Module Dependency (Lazy Injection)

Gunakan **lazy getter** untuk menghindari circular dependency saat bootstrap:

```typescript
// ✅ CORRECT: lazy getter pattern
export class UserService {
  constructor(
    private repo = new UserRepo(),
    // Lazy getters — called at runtime, not at construction time
    private getRoleService?: () => RoleService,
    private getAssignmentService?: () => UserAssignmentService,
    private getLocationService?: () => LocationMasterService,
  ) {}

  private async buildUserDetail(user: UserDto) {
    // Called lazily at runtime — no circular dep issue
    const roleService = this.getRoleService!()
    const locationService = this.getLocationService!()
    // ...
  }
}

// IamModule wires everything
export class IamModule {
  public readonly service: IamServices

  constructor(private getExternalModules: () => { location: LocationServiceModule }) {
    const role = new RoleService()
    const assignment = new UserAssignmentService()
    const user = new UserService(
      undefined,           // use default repo
      () => role,          // lazy: same module
      () => assignment,    // lazy: same module
      () => this.getExternalModules().location.location, // lazy: external module
    )
    this.service = { user, role, assignment }
  }
}

// Registry wires modules
const location = new LocationServiceModule()
const iam = new IamModule(() => ({ location }))  // lazy factory
```

### Rules

1. **Constructor injection** untuk dependencies yang tidak circular.
2. **Lazy getter** `() => dep` untuk mencegah circular dependency saat instantiation.
3. **getExternalModules factory** pada root Module class untuk menyelesaikan cross-module dependency.
4. **Repo selalu private** — tidak pernah diekspos ke luar service.

---

## Barrel Import Policy

Tujuan: **mencegah autocompletion editor menjadi berat** karena terlalu banyak symbol yang terekspos dari satu entry point.

### Aturan

| Import | Dari mana | ✓/✗ |
|--------|-----------|-----|
| `IamModule`, `IamServices` | `@/modules/iam` | ✅ |
| DTO spesifik | `@/modules/iam/dto/user.dto` | ✅ |
| DTO barrel (multi) | `@/modules/iam/dto` | ✅ (internal use) |
| Service type spesifik | `@/modules/iam/service/user.service` | ✅ |
| `import * from '@/modules/iam'` | — | ❌ **DILARANG** |
| `import { UserRepo } from '@/modules/iam'` | — | ❌ Repo tidak boleh diekspos |

### Root `index.ts` — Hanya Public API

```typescript
// ✅ index.ts modul hanya export class Module dan interface Services
// TIDAK boleh: export * from './dto'
// TIDAK boleh: export * from './service'
// TIDAK boleh: export * from './router'

export interface IamServices { ... }
export class IamModule { ... }
```

### `dto/index.ts` dan `service/index.ts` — Internal Convenience Barrel

File barrel di sub-folder (`dto/index.ts`, `service/index.ts`, `repo/index.ts`) tetap boleh ada sebagai convenience untuk penggunaan **internal di dalam modul itu sendiri**. Mereka tidak diekspos kembali dari root `index.ts`.

---

## Repository Layer

### Pattern

```typescript
export class EntityRepo {
  /* ---------------------------------------------------------------------- */
  /*  QUERY                                                                   */
  /* ---------------------------------------------------------------------- */

  async getList(): Promise<dto.EntityDto[]> {
    return record('EntityRepo.getList', async () => {
      return db.select().from(entityTable)
    })
  }

  async getListPaginated(filter: dto.EntityFilterDto): Promise<WithPaginationResult<dto.EntityDto>> {
    return record('EntityRepo.getListPaginated', async () => {
      const where = this.buildWhereClause(filter)
      return paginate({
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
      return db.select({ count: count() }).from(entityTable).then(r => r[0]?.count ?? 0)
    })
  }

  /* ---------------------------------------------------------------------- */
  /*  MUTATION                                                                */
  /* ---------------------------------------------------------------------- */

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

  /* ---------------------------------------------------------------------- */
  /*  PRIVATE                                                                 */
  /* ---------------------------------------------------------------------- */

  private buildWhereClause(filter: Partial<dto.EntityFilterDto>) {
    const { q } = filter
    return and(
      q ? searchFilter(entityTable.name, q) : undefined,
    )
  }
}
```

### Key Principles

1. Setiap method di-wrap dengan `record()` untuk telemetry.
2. Tidak ada business logic, tidak ada caching di repo.
3. Transaksi multi-step menggunakan `db.transaction(async (tx) => { ... })`.
4. `stampCreate(actorId)` dan `stampUpdate(actorId)` untuk audit columns.
5. Gunakan `paginate()` dari `@/core/database` untuk paginated queries.

---

## Caching Strategy

### BentoCache Pattern

```typescript
const cache = bento.namespace('entity') // isolate namespace per entity

// READ: getOrSet — cache miss triggers factory
const entity = await cache.getOrSet({
  key: ENTITY_CACHE_KEYS.DETAIL(id),
  factory: async ({ skip }) => {
    const row = await this.repo.getById(id)
    return row ?? skip() // skip() = don't cache if not found
  },
})

// WRITE: invalidate after mutation
private async clearCache(id?: number): Promise<void> {
  const keys = [ENTITY_CACHE_KEYS.LIST, ENTITY_CACHE_KEYS.COUNT]
  if (id) keys.push(ENTITY_CACHE_KEYS.DETAIL(id))
  await cache.deleteMany({ keys })
}
```

### Cache Keys Convention

```typescript
// constants.ts
export const ENTITY_CACHE_KEYS = {
  LIST: 'list',
  COUNT: 'count',
  DETAIL: (id: number) => `detail.${id}`,
}
```

### Rules

1. Cache **selalu di-invalidate setelah setiap write** (`handleCreate`, `handleUpdate`, `handleRemove`).
2. Method `clearCache()` **selalu private** — tidak ada external caller yang boleh men-skip invalidation.
3. Gunakan `cache.deleteMany()` untuk batch invalidation.

---

## Error Handling

### Domain Error Factories

```typescript
// errors.ts
import { NotFoundError, InternalServerError, ConflictError } from '@/core/http/errors'

export const EntityErrors = {
  notFound: (id: number) =>
    new NotFoundError(`Entity with ID ${id} not found`, 'ENTITY_NOT_FOUND'),
  createFailed: () =>
    new InternalServerError('Entity creation failed', 'ENTITY_CREATE_FAILED'),
  codeExists: () =>
    new ConflictError('Entity code already exists', 'ENTITY_CODE_EXISTS'),
}
```

### Error Reference

| Error Class | HTTP Status | When to Use |
|------------|-------------|-------------|
| `NotFoundError` | 404 | Resource tidak ditemukan |
| `ConflictError` | 409 | Duplicate / uniqueness violation |
| `BadRequestError` | 400 | Input tidak valid secara business |
| `UnauthorizedError` | 401 | Tidak terautentikasi |
| `ForbiddenError` | 403 | Terautentikasi tapi tidak berhak |
| `InternalServerError` | 500 | Unexpected failure |

---

## Validation Strategy

### DTO Composition

```typescript
// ✅ Gunakan spread-shape, bukan .extend()
const EntityUpdateDto = z.object({
  ...zc.RecordId.shape,    // { id: zp.id }
  ...EntityMutationDto.shape,
  name: zp.str.optional(),
})
```

### Zod Primitives

```typescript
// @/core/validation
zp.str         // z.string()
zp.strNullable // z.string().nullable()
zp.id          // z.number().int().positive()
zp.bool        // z.boolean()
zq.search      // z.string().optional().trim()
zq.id          // z.coerce.number().int().positive()
zq.boolean     // z.string().transform(v => v === 'true').optional()
zc.RecordId    // z.object({ id: zp.id })
zc.email       // email validator
zc.password    // password validator (min 8)
zc.username    // username validator (3-50 chars)
```

---

## HTTP & Router Layer

### Route Function Pattern

```typescript
// router/entity.route.ts
import { Elysia } from 'elysia'
import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createPaginatedResponseSchema, createSuccessResponseSchema, zc, zq } from '@/core/validation'
import * as dto from '../dto/entity.dto'
import type { EntityService } from '../service/entity.service'

export function initEntityRoute(service: EntityService) {
  return new Elysia({ prefix: '/entity' })
    .use(authPluginMacro)
    .get(
      '/list',
      async function list({ query }) {
        const result = await service.handleList(query)
        return res.paginated(result)
      },
      {
        query: dto.EntityFilterDto,
        response: createPaginatedResponseSchema(dto.EntityDto),
        auth: true,
      },
    )
    .get(
      '/detail',
      async function detail({ query }) {
        const result = await service.handleDetail(query.id)
        return res.ok(result)
      },
      {
        query: zq.recordId,
        response: createSuccessResponseSchema(dto.EntityDto),
        auth: true,
      },
    )
    .post(
      '/create',
      async function create({ body, auth }) {
        const result = await service.handleCreate(body, auth.userId)
        return res.ok(result)
      },
      { body: dto.EntityCreateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
    )
    .put(
      '/update',
      async function update({ body, auth }) {
        const result = await service.handleUpdate(body.id, body, auth.userId)
        return res.ok(result)
      },
      { body: dto.EntityUpdateDto, response: createSuccessResponseSchema(zc.RecordId), auth: true },
    )
    .delete(
      '/remove',
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
// router/index.ts
export function initEntityRouteModule(m: EntityModule) {
  return new Elysia({ prefix: '/entity' })
    .use(initEntityRoute(m.service.entity))
    // tambah sub-routes lain jika ada
}

// _routes.ts
import { initEntityRouteModule } from './entity'
routes.push(initEntityRouteModule(m.entity))
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
