# Module Templates & Standards

**Version**: 2.0  
**Last Updated**: 2026-06-24

Copy-paste ready templates for creating new modules following Ikki ERP standards.

## 📐 Module Structure Standard

### Simple Module (< 3 features)
```
modules/{module}/
├── {module}.contract.ts    # Zod schemas (validation)
├── {module}.internal.ts    # Error definitions
├── {module}.repo.ts        # Data access
├── {module}.service.ts     # Business logic
├── {module}.route.ts       # HTTP routes
├── {module}.module.ts      # DI factory
└── index.ts                # Public API
```

### Complex Module (≥ 3 features or cross-cutting)
```
modules/{module}/
├── {module}.module.ts      # Aggregate DI factory
├── {module}.route.ts       # Aggregate routes
├── {feature1}/             # Feature submodule
│   ├── {feature1}.contract.ts
│   ├── {feature1}.internal.ts
│   ├── {feature1}.repo.ts
│   ├── {feature1}.service.ts
│   └── {feature1}.route.ts
├── {feature2}/             # Feature submodule
├── composed/               # Cross-feature queries (if needed)
└── index.ts                # Public API
```

### Key Conventions
- **Contract**: Validation schemas (Zod)
- **Internal**: Error definitions & internal types
- **Repo**: Data access layer (Drizzle)
- **Service**: Business logic (handleX methods)
- **Route**: HTTP endpoints (Elysia)
- **Module**: Dependency injection factory

---

## 📋 Quick Start

Replace `{module}` and `{Module}` with your module name:
- `{module}` = lowercase, e.g., `location`, `user`, `product`
- `{Module}` = PascalCase, e.g., `Location`, `User`, `Product`

---

## 1. Internal (Error Definitions)

### File: `{module}.internal.ts`

```typescript
import { ConflictError, NotFoundError } from '@/shared/errors/http-error'

export const {Module}Error = {
  notFound: (id: number) =>
    new NotFoundError(`{Module} with ID ${id} not found`, { code: '{MODULE}_NOT_FOUND' }),
  codeExists: (code: string) =>
    new ConflictError(`{Module} with code ${code} already exists`, { code: '{MODULE}_CODE_EXISTS' }),
  createFailed: () =>
    new NotFoundError('{Module} creation failed', { code: '{MODULE}_CREATE_FAILED' }),
}
```

---

## 2. Contract

### File: `{module}.contract.ts`

```typescript
import { z } from 'zod'
import { zc, zp } from '@/shared/schema'

/* --------------------------------- ENTITY --------------------------------- */

export const {Module}Dto = z.object({
  id: zp.id,
  name: zp.str,
  code: zp.str,
  description: zp.strNullable,
  isActive: zp.bool,
  ...zc.AuditBasic.shape,
})
export type {Module}Dto = z.infer<typeof {Module}Dto>

/* ---------------------------------- HTTP ---------------------------------- */

const {Module}MutationDto = z.object({
  name: zc.name,
  code: zc.code,
  description: zp.strNullable,
  isActive: zp.bool.default(true),
})

export const {Module}CreateDto = z.object({
  ...{Module}MutationDto.shape,
})
export type {Module}CreateDto = z.infer<typeof {Module}CreateDto>

export const {Module}UpdateDto = z.object({
  ...zc.RecordId.shape,
  ...{Module}MutationDto.shape,
})
export type {Module}UpdateDto = z.infer<typeof {Module}UpdateDto>

/* --------------------------------- FILTER --------------------------------- */

export const {Module}FilterDto = z.object({
  ...zc.PaginationQuery.shape,
  search: zp.str.optional(),
  isActive: zp.bool.optional(),
})
export type {Module}FilterDto = z.infer<typeof {Module}FilterDto>
```

---

## 3. Repository

### File: `{module}.repo.ts`

```typescript
import { eq, and, inArray, like, sql } from 'drizzle-orm'

import { {module}sTable } from '@/db/schema'

import type { DbContext } from '@/infra/database'
import { paginate } from '@/infra/database'

import type { WithPaginationResult } from '@/types/pagination'

import type { {Module}CreateDto, {Module}Dto, {Module}FilterDto } from './{module}.contract'

export class {Module}Repo {
  constructor(readonly db: DbContext) {}

  async findById(id: number): Promise<{Module}Dto | null> {
    return await this.db
      .select()
      .from({module}sTable)
      .where(eq({module}sTable.id, id))
      .then(rows => rows[0] ?? null)
  }

  async findByIds(ids: number[]): Promise<{Module}Dto[]> {
    if (ids.length === 0) return []
    return await this.db
      .select()
      .from({module}sTable)
      .where(inArray({module}sTable.id, ids))
  }

  async findAll(): Promise<{Module}Dto[]> {
    return await this.db.select().from({module}sTable)
  }

  async findWithPagination(
    filter: {Module}FilterDto,
  ): Promise<WithPaginationResult<{Module}Dto>> {
    const query = this.db.select().from({module}sTable)

    const conditions = []
    
    if (filter.search) {
      conditions.push(like({module}sTable.name, `%${filter.search}%`))
    }
    
    if (filter.isActive !== undefined) {
      conditions.push(eq({module}sTable.isActive, filter.isActive))
    }

    if (conditions.length > 0) {
      query.where(and(...conditions))
    }

    return await paginate(query, {
      page: filter.page,
      limit: filter.limit,
    })
  }

  async create(data: {Module}CreateDto): Promise<{Module}Dto> {
    return await this.db
      .insert({module}sTable)
      .values(data)
      .returning()
      .then(rows => rows[0])
  }

  async update(id: number, data: Partial<{Module}Dto>): Promise<{Module}Dto> {
    return await this.db
      .update({module}sTable)
      .set(data)
      .where(eq({module}sTable.id, id))
      .returning()
      .then(rows => rows[0])
  }

  async delete(id: number): Promise<void> {
    await this.db.delete({module}sTable).where(eq({module}sTable.id, id))
  }

  async existsById(id: number): Promise<boolean> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from({module}sTable)
      .where(eq({module}sTable.id, id))
      .then(rows => rows[0])
    return result.count > 0
  }
}
```

---

## 3. Service

### File: `{module}.service.ts`

```typescript
import { record } from '@elysiajs/opentelemetry'

import { {module}sTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'

import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import { NotFoundError } from '@/shared/errors/http-error'
import { RelationMap } from '@/shared/utils'

import type { WithPaginationResult } from '@/types/pagination'
import type { ActorId } from '@/types/utils'

import type {
  {Module}CreateDto,
  {Module}Dto,
  {Module}FilterDto,
  {Module}UpdateDto,
} from './{module}.contract'
import { {Module}Error } from './{module}.internal'
import type { {Module}Repo } from './{module}.repo'

const uniqueFields: ConflictField<{ name: string; code: string }>[] = [
  {
    field: 'name',
    column: {module}sTable.name,
    message: '{Module} name already exists',
    code: '{MODULE}_NAME_ALREADY_EXISTS',
  },
  {
    field: 'code',
    column: {module}sTable.code,
    message: '{Module} code already exists',
    code: '{MODULE}_CODE_ALREADY_EXISTS',
  },
]

export class {Module}Service {
  private readonly cache: CacheService

  constructor(
    private readonly repo: {Module}Repo,
    cacheClient: CacheClient,
  ) {
    this.cache = CacheService.createWithDefaultKeys(cacheClient, '{module}')
  }

  @record('{module}.create')
  async handleCreate(dto: {Module}CreateDto, actor: ActorId): Promise<{Module}Dto> {
    await checkConflict(this.repo.db, uniqueFields, dto)

    const {module} = await this.repo.create({
      ...dto,
      ...stampCreate(actor),
    })

    await this.cache.deleteAll()

    return {module}
  }

  @record('{module}.update')
  async handleUpdate(dto: {Module}UpdateDto, actor: ActorId): Promise<{Module}Dto> {
    const existing = await this.repo.findById(dto.id)
    if (!existing) {
      throw {Module}Error.notFound(dto.id)
    }

    await checkConflict(this.repo.db, uniqueFields, dto, dto.id)

    const updated = await this.repo.update(dto.id, {
      ...dto,
      ...stampUpdate(actor),
    })

    await this.cache.delete(dto.id)
    await this.cache.deleteAll()

    return updated
  }

  @record('{module}.getById')
  async handleGetById(id: number): Promise<{Module}Dto> {
    return await this.cache.getOrSet(id, async () => {
      const {module} = await this.repo.findById(id)
      if (!{module}) {
        throw {Module}Error.notFound(id)
      }
      return {module}
    })
  }

  @record('{module}.getByIds')
  async handleGetByIds(ids: number[]): Promise<{Module}Dto[]> {
    if (ids.length === 0) return []
    return await this.repo.findByIds(ids)
  }

  @record('{module}.list')
  async handleList(
    filter: {Module}FilterDto,
  ): Promise<WithPaginationResult<{Module}Dto>> {
    return await this.cache.getOrSet(`list:${JSON.stringify(filter)}`, async () => {
      return await this.repo.findWithPagination(filter)
    })
  }

  @record('{module}.delete')
  async handleDelete(id: number, actor: ActorId): Promise<void> {
    const existing = await this.repo.findById(id)
    if (!existing) {
      throw {Module}Error.notFound(id)
    }

    // Check dependencies here if needed
    // Example:
    // const hasRelated = await this.relatedRepo.existsByXxxId(id)
    // if (hasRelated) {
    //   throw {Module}Error.hasRelated(id)
    // }

    await this.repo.delete(id)

    await this.cache.delete(id)
    await this.cache.deleteAll()
  }

  toRelationMap(items: {Module}Dto[]): RelationMap<number, {Module}Dto> {
    return RelationMap.fromArray(items, (v) => v.id)
  }
}
```

---

## 4. Internal

### File: `{module}.internal.ts`

```typescript
import { NotFoundError, ConflictError } from '@/shared/errors/http-error'

export const {Module}Error = {
  notFound: (id: number) =>
    new NotFoundError('{Module} not found', {
      code: '{MODULE}_NOT_FOUND',
      context: { id },
    }),

  nameExists: (name: string) =>
    new ConflictError('{Module} name already exists', {
      code: '{MODULE}_NAME_ALREADY_EXISTS',
      context: { name },
    }),

  codeExists: (code: string) =>
    new ConflictError('{Module} code already exists', {
      code: '{MODULE}_CODE_ALREADY_EXISTS',
      context: { code },
    }),
}
```

---

## 6. Module Factory

### File: `{module}.module.ts`

### Simple Module (No Dependencies)

```typescript
import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { {Module}Repo } from './{module}.repo'
import { {Module}Service } from './{module}.service'

export interface {Module}Module {
  {module}: {Module}Service
}

export function create{Module}Module(
  db: DbContext,
  cacheClient: CacheClient,
): {Module}Module {
  const repo = new {Module}Repo(db)
  const service = new {Module}Service(repo, cacheClient)

  return { {module}: service }
}
```

### Complex Module (With Dependencies)

```typescript
import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { LocationModule } from '@/modules/location'
import type { IamModule } from '@/modules/iam'

import { {Module}Repo } from './{module}.repo'
import { {Module}Service } from './{module}.service'

interface Deps {
  location: LocationModule
  iam: IamModule
}

export interface {Module}Module {
  {module}: {Module}Service
}

export function create{Module}Module(
  db: DbContext,
  cacheClient: CacheClient,
  deps: Deps,
): {Module}Module {
  const repo = new {Module}Repo(db)
  const service = new {Module}Service(
    repo,
    cacheClient,
    {
      location: deps.location,
      iam: deps.iam,
    },
  )

  return { {module}: service }
}
```

---

## 6. Routes

### File: `{module}.route.ts`

```typescript
import { Elysia, t } from 'elysia'

import type { Modules } from '@/modules/_registry'

import { {Module}CreateDto, {Module}FilterDto, {Module}UpdateDto } from './{module}.contract'

export const {module}Routes = (app: Elysia, modules: Modules) =>
  app.group('/{module}s', (app) =>
    app
      .get(
        '/',
        async ({ query }) => {
          return await modules.{module}.handleList(query)
        },
        { query: {Module}FilterDto },
      )

      .get('/:id', async ({ params }) => {
        return await modules.{module}.handleGetById(params.id)
      })

      .post(
        '/',
        async ({ body, user }) => {
          return await modules.{module}.handleCreate(body, user.id)
        },
        { body: {Module}CreateDto },
      )

      .patch(
        '/:id',
        async ({ params, body, user }) => {
          return await modules.{module}.handleUpdate(
            { ...body, id: params.id },
            user.id,
          )
        },
        { body: t.Omit({Module}UpdateDto, ['id']) },
      )

      .delete('/:id', async ({ params, user }) => {
        await modules.{module}.handleDelete(params.id, user.id)
        return { success: true }
      }),
  )
```

---

## 7. Public API

### File: `index.ts`

```typescript
export type { {Module}Module } from './{module}.module'
export { create{Module}Module } from './{module}.module'

export type {
  {Module}Dto,
  {Module}CreateDto,
  {Module}UpdateDto,
  {Module}FilterDto,
} from './{module}.contract'
```

---

## 8. Database Schema

### File: `db/schema/{module}.ts`

```typescript
import { pgTable, serial, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core'

export const {module}sTable = pgTable('{module}s', {
  id: serial('id').primaryKey(),
  
  // Business fields
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  isActive: boolean('is_active').notNull().default(true),
  
  // Audit fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by').notNull(),
})
```

---

## 9. Test Template

### File: `{module}.test.ts`

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test'

import type { CacheClient } from '@/infra/cache'

import { {Module}Service } from './{module}.service'
import type { {Module}Repo } from './{module}.repo'
import type { {Module}CreateDto } from './{module}.contract'

describe('{Module}Service', () => {
  let service: {Module}Service
  let mockRepo: {Module}Repo
  let mockCache: CacheClient

  beforeEach(() => {
    mockRepo = {
      db: {} as any,
      findById: mock(() => Promise.resolve(null)),
      findByIds: mock(() => Promise.resolve([])),
      create: mock((data) =>
        Promise.resolve({
          id: 1,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      update: mock((id, data) =>
        Promise.resolve({
          id,
          ...data,
          updatedAt: new Date(),
        }),
      ),
      delete: mock(() => Promise.resolve()),
    } as any

    mockCache = {
      getOrSet: mock((key, fn) => fn()),
      set: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      deleteAll: mock(() => Promise.resolve()),
    } as any

    service = new {Module}Service(mockRepo, mockCache)
  })

  describe('handleCreate', () => {
    it('should create {module}', async () => {
      const dto: {Module}CreateDto = {
        name: 'Test {Module}',
        code: 'TEST',
        description: 'Test description',
        isActive: true,
      }

      const result = await service.handleCreate(dto, 1)

      expect(result).toMatchObject({
        name: 'Test {Module}',
        code: 'TEST',
      })
      expect(mockRepo.create).toHaveBeenCalledTimes(1)
      expect(mockCache.deleteAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleGetById', () => {
    it('should return {module} if found', async () => {
      const mock{Module} = {
        id: 1,
        name: 'Test',
        code: 'TEST',
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 1,
        updatedBy: 1,
      }

      mockRepo.findById = mock(() => Promise.resolve(mock{Module}))

      const result = await service.handleGetById(1)

      expect(result).toEqual(mock{Module})
    })

    it('should throw NotFoundError if not found', async () => {
      mockRepo.findById = mock(() => Promise.resolve(null))

      await expect(service.handleGetById(999)).rejects.toThrow('not found')
    })
  })
})
```

---

## 10. Integration Test Template

### File: `{module}.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'

import { testClient } from '@/tests/helpers/test-client'

describe('{Module} Integration', () => {
  let created{Module}Id: number

  describe('POST /{module}s', () => {
    it('should create {module}', async () => {
      const response = await testClient.{module}s.post({
        name: 'Integration Test {Module}',
        code: 'INTEG_TEST',
        description: 'Created via integration test',
        isActive: true,
      })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({
        name: 'Integration Test {Module}',
        code: 'INTEG_TEST',
      })
      expect(response.data.id).toBeDefined()

      created{Module}Id = response.data.id
    })

    it('should fail with duplicate code', async () => {
      const response = await testClient.{module}s.post({
        name: 'Duplicate Test',
        code: 'INTEG_TEST',
        description: 'Should fail',
        isActive: true,
      })

      expect(response.status).toBe(409)
      expect(response.error.code).toBe('{MODULE}_CODE_ALREADY_EXISTS')
    })
  })

  describe('GET /{module}s/:id', () => {
    it('should get {module} by id', async () => {
      const response = await testClient.{module}s.get(created{Module}Id)

      expect(response.status).toBe(200)
      expect(response.data.id).toBe(created{Module}Id)
    })

    it('should return 404 for non-existent id', async () => {
      const response = await testClient.{module}s.get(999999)

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /{module}s/:id', () => {
    it('should update {module}', async () => {
      const response = await testClient.{module}s.patch(created{Module}Id, {
        name: 'Updated Name',
        isActive: false,
      })

      expect(response.status).toBe(200)
      expect(response.data.name).toBe('Updated Name')
      expect(response.data.isActive).toBe(false)
    })
  })

  describe('DELETE /{module}s/:id', () => {
    it('should delete {module}', async () => {
      const response = await testClient.{module}s.delete(created{Module}Id)

      expect(response.status).toBe(200)

      // Verify deletion
      const getResponse = await testClient.{module}s.get(created{Module}Id)
      expect(getResponse.status).toBe(404)
    })
  })
})
```

---

## 11. Complex Module Template

### For Modules with Submodules

#### Directory Structure

```
{module}/
├── {module}.module.ts      # Aggregate factory
├── {module}.route.ts       # Aggregate routes
├── index.ts                # Public exports
├── constants.ts            # Module-wide constants
│
├── {sub1}/                 # Submodule 1
│   ├── {sub1}.contract.ts
│   ├── {sub1}.repo.ts
│   └── {sub1}.service.ts
│
├── {sub2}/                 # Submodule 2
│   └── ...
│
└── composed/               # Cross-submodule queries
    ├── composed.repo.ts
    └── composed.service.ts
```

#### Module Factory: `{module}.module.ts`

```typescript
import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { {Sub1}Repo } from './{sub1}/{sub1}.repo'
import { {Sub1}Service } from './{sub1}/{sub1}.service'
import { {Sub2}Repo } from './{sub2}/{sub2}.repo'
import { {Sub2}Service } from './{sub2}/{sub2}.service'
import { ComposedRepo } from './composed/composed.repo'
import { ComposedService } from './composed/composed.service'

interface Deps {
  // External dependencies
}

export interface {Module}Module {
  {sub1}: {Sub1}Service
  {sub2}: {Sub2}Service
  composed: ComposedService
}

export function create{Module}Module(
  db: DbContext,
  cacheClient: CacheClient,
  deps: Deps,
): {Module}Module {
  // 1. Create repos
  const {sub1}Repo = new {Sub1}Repo(db)
  const {sub2}Repo = new {Sub2}Repo(db)
  const composedRepo = new ComposedRepo(db)

  // 2. Create services (resolve dependencies bottom-up)
  const {sub1} = new {Sub1}Service({sub1}Repo, cacheClient)
  const {sub2} = new {Sub2}Service({sub2}Repo, cacheClient)
  
  const composed = new ComposedService(
    { {sub1}, {sub2} },
    composedRepo,
  )

  return { {sub1}, {sub2}, composed }
}
```

#### Aggregate Routes: `{module}.route.ts`

```typescript
import { Elysia } from 'elysia'

import type { Modules } from '@/modules/_registry'

import { {sub1}Routes } from './{sub1}/{sub1}.route'
import { {sub2}Routes } from './{sub2}/{sub2}.route'

export const {module}Routes = (app: Elysia, modules: Modules) =>
  app.group('/{module}', (app) =>
    app
      .use((app) => {sub1}Routes(app, modules))
      .use((app) => {sub2}Routes(app, modules)),
  )
```

---

## Quick Copy Commands

```bash
# Simple module
cp -r src/modules/location src/modules/{module}
# Then replace all occurrences

# Complex module
cp -r src/modules/iam src/modules/{module}
# Then replace all occurrences
```

---

## Replacement Checklist

After copying a template, replace:

- [ ] `{module}` → actual module name (lowercase)
- [ ] `{Module}` → actual module name (PascalCase)
- [ ] `{MODULE}` → actual module name (UPPERCASE)
- [ ] `{module}s` → pluralized module name
- [ ] Business fields (name, code, etc.) → actual fields
- [ ] Unique constraints → actual unique fields
- [ ] Dependencies → actual module dependencies

---

**Tip:** Use find-and-replace in your editor:
- Find: `{module}` → Replace: `product`
- Find: `{Module}` → Replace: `Product`
- Find: `{MODULE}` → Replace: `PRODUCT`

Done! 🎉
