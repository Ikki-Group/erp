# Module Architecture Blueprint

## Executive Summary

This document defines the standardized module architecture for Ikki ERP server modules, based on the refactored `material` module. Use this as the reference implementation for all future modules and refactors.

---

## Module Structure

```
modules/
├── <module-name>/
│   ├── index.ts              # ServiceModule + RouteModule exports
│   ├── constants.ts          # Module-level constants
│   ├── errors.ts             # Centralized error factories
│   ├── types.ts              # Shared types/interfaces
│   │
│   └── <feature>/            # Sub-features
│       ├── dto.ts            # Zod schemas + TypeScript types
│       ├── repo.ts           # Database access layer
│       ├── service.ts        # Business logic
│       └── route.ts          # HTTP routes
```

---

## Core Files

### 1. constants.ts

Centralized constants following `{MODULE}_{TYPE}` naming:

```typescript
// Cache namespaces: {module}:{feature} pattern
export const MATERIAL_CACHE_NS = {
  CATEGORY: 'material:category',
  UOM: 'material:uom',
  MASTER: 'material:master',
} as const

// Standard cache keys
export const CACHE_KEY = {
  LIST: 'list',
  COUNT: 'count',
  BY_ID: (id: number | string) => `byId:${id}`,
} as const

// Error codes
export const ERROR_CODES = {
  MATERIAL_NOT_FOUND: 'MATERIAL_NOT_FOUND',
  // ...
} as const
```

### 2. errors.ts

Centralized error factories organized by domain:

```typescript
export const MasterErrors = {
  notFound: (id: number) =>
    new NotFoundError(`Material ${id} not found`, ERROR_CODES.MATERIAL_NOT_FOUND),
  createFailed: () =>
    new InternalServerError('Material creation failed', ERROR_CODES.MATERIAL_CREATE_FAILED),
} as const

// Aggregated export
export const MaterialErrors = {
  master: MasterErrors,
  category: CategoryErrors,
  // ...
} as const
```

### 3. types.ts

Shared types and utility interfaces:

```typescript
export interface RepoDep<TRepo> {
  repo: TRepo
}

export interface MutationContext {
  actorId: number
  tx: DbClient
}
```

---

## Service Pattern

### Dependency Injection Structure

```typescript
export class ExampleService {
  private readonly cache: CacheService

  constructor(
    private readonly deps: {
      // Repositories this service owns
      repo: ExampleRepo
      // Cross-module service dependencies
      otherService: OtherService
      // DbClient for transactions (if needed)
      db: DbClient
    },
    cacheClient: CacheClient,
  ) {
    this.cache = new CacheService({
      ns: EXAMPLE_CACHE_NS.FEATURE,
      client: cacheClient,
    })
  }
}
```

### Method Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Read single | `getById` | `getById(id: number)` |
| Read many | `getByIds` | `getByIds(ids: number[])` |
| Read all | `getList` | `getList()` |
| Read count | `count` | `count()` |
| Relation map | `getRelationMap` | `getRelationMap()` |
| HTTP handler | `handle*` | `handleCreate`, `handleUpdate` |
| Batch operations | `batch*` | `batchCreate`, `batchUpdate` |

### Cache Pattern

```typescript
// Read with cache
async getList(): Promise<Dto[]> {
  return record('ServiceName.getList', async () => {
    return this.cache.getOrSet({
      key: CACHE_KEY.LIST,
      factory: () => this.deps.repo.getList(),
    })
  })
}

// Read single with undefined handling
async getById(id: number): Promise<Dto | undefined> {
  return record('ServiceName.getById', async () => {
    return this.cache.getOrSetSkipUndefined({
      key: CACHE_KEY.BY_ID(id),
      factory: () => this.deps.repo.getById(id),
    })
  })
}

// Invalidate on mutation
async handleCreate(data: CreateDto, actorId: number): Promise<RecordId> {
  // ... create logic
  await this.cache.deleteMany({
    keys: [CACHE_KEY.LIST, CACHE_KEY.COUNT],
  })
  return result
}
```

### Transaction Pattern

```typescript
// Add to service class
private async withTx<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
  return this.deps.db.transaction(fn)
}

// Use in handlers
async handleCreate(data: CreateDto, actorId: number): Promise<RecordId> {
  return record('ServiceName.handleCreate', async () => {
    const created = await this.withTx(async (tx) => {
      const entity = await this.deps.repo.create(data, actorId)
      await this.deps.otherService.batchCreate(entity.id, data.items, actorId, tx)
      return entity
    })
    await this.cache.deleteMany({ keys: [CACHE_KEY.LIST, CACHE_KEY.COUNT] })
    return created
  })
}
```

---

## Module Index (index.ts)

### ServiceModule Pattern

```typescript
export class ExampleServiceModule {
  public readonly featureA: FeatureAService
  public readonly featureB: FeatureBService

  constructor(
    private readonly db: DbClient,
    private readonly cacheClient: CacheClient,
    private readonly deps: {
      // Cross-module dependencies
      location: LocationMasterService
      otherModule: OtherServiceModule
    },
  ) {
    // 1. Base services (no cross-dependencies)
    const repoA = new FeatureARepo(this.db)
    this.featureA = new FeatureAService({ repo: repoA }, this.cacheClient)

    // 2. Dependent services
    const repoB = new FeatureBRepo(this.db)
    this.featureB = new FeatureBService(
      {
        repo: repoB,
        featureA: this.featureA,
        location: this.deps.location,
        db: this.db,
      },
      this.cacheClient,
    )
  }
}
```

### RouteModule Pattern

```typescript
export function initExampleRouteModule(s: ExampleServiceModule) {
  return new Elysia({ prefix: '/example' })
    .use(initFeatureARoute(s.featureA))
    .use(initFeatureBRoute(s.featureB))
}
```

### Re-exports

```typescript
// DTOs
export { FeatureADto, FeatureACreateDto } from './feature-a/dto'

// Service types (for cross-module use)
export type { FeatureAService } from './feature-a/service'
```

---

## Cross-Module Communication Rules

### ✅ DO
- Access other modules through their **public service methods only**
- Use `getRelationMap()` for batch lookups
- Call `getById()`, `getList()` for single/collection reads
- Pass `DbTx` through service methods for transactions

### ❌ DON'T
- Access another module's repository directly
- Import another module's internal files (skip the index)
- Use direct `db` imports in services (always use injected `DbClient`)

---

## Migration Checklist

When refactoring existing modules:

- [ ] Create `constants.ts` with standardized cache namespaces
- [ ] Create `errors.ts` with centralized error factories
- [ ] Create `types.ts` for shared types (if needed)
- [ ] Update all services to use `deps: { repo, ... }` pattern
- [ ] Add `readonly` to all DI dependencies
- [ ] Replace direct `db` imports with injected `DbClient`
- [ ] Use `CACHE_KEY` constants instead of hardcoded strings
- [ ] Standardize method names (`getList` not `find`)
- [ ] Update module index to use `deps` pattern
- [ ] Update `_registry.ts` with new signature
- [ ] Add new cache namespaces to `core/cache/config.ts`

---

## Registry Pattern

In `_registry.ts`, initialize modules with proper dependency injection:

```typescript
export function initModules(db: DbClient): Modules {
  const cacheClient = createCache()

  // Layer 0 — Core (no dependencies)
  const location = new LocationServiceModule(db, cacheClient)

  // Layer 1 — Masters (depends on Layer 0)
  const material = new MaterialServiceModule(db, cacheClient, { location: location.master })

  // Layer 2 — Operations (depends on Layer 0 + 1)
  const inventory = new InventoryServiceModule(db, cacheClient, { material })

  return { location, material, inventory }
}
```

---

## Key Principles

1. **Dependency Inversion**: Services depend on abstractions (deps object), not concrete implementations
2. **Single Responsibility**: Each service owns one feature domain
3. **Explicit Dependencies**: All dependencies are visible in the constructor `deps` object
4. **No Repo Leaking**: Never expose repositories outside their owning module
5. **Cache Consistency**: Use standardized cache keys and namespaces
6. **Transaction Safety**: Always use injected `DbClient` for transactions

---

## Example: Complete Service Implementation

```typescript
// constants.ts
export const EXAMPLE_CACHE_NS = {
  FEATURE: 'example:feature',
} as const

// errors.ts
export const FeatureErrors = {
  notFound: (id: number) =>
    new NotFoundError(`Feature ${id} not found`, 'FEATURE_NOT_FOUND'),
} as const

// feature/service.ts
import { CACHE_KEY, EXAMPLE_CACHE_NS } from '../constants'
import { FeatureErrors } from '../errors'

export class FeatureService {
  private readonly cache: CacheService

  constructor(
    private readonly deps: {
      repo: FeatureRepo
      db: DbClient
    },
    cacheClient: CacheClient,
  ) {
    this.cache = new CacheService({
      ns: EXAMPLE_CACHE_NS.FEATURE,
      client: cacheClient,
    })
  }

  private async withTx<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
    return this.deps.db.transaction(fn)
  }

  async getList(): Promise<FeatureDto[]> {
    return record('FeatureService.getList', async () => {
      return this.cache.getOrSet({
        key: CACHE_KEY.LIST,
        factory: () => this.deps.repo.getList(),
      })
    })
  }

  async getById(id: number): Promise<FeatureDto | undefined> {
    return record('FeatureService.getById', async () => {
      return this.cache.getOrSetSkipUndefined({
        key: CACHE_KEY.BY_ID(id),
        factory: () => this.deps.repo.getById(id),
      })
    })
  }

  async handleCreate(data: CreateDto, actorId: number): Promise<RecordId> {
    return record('FeatureService.handleCreate', async () => {
      const result = await this.withTx(async (tx) => {
        return this.deps.repo.create(data, actorId, tx)
      })

      await this.cache.deleteMany({
        keys: [CACHE_KEY.LIST, CACHE_KEY.COUNT],
      })

      return result
    })
  }
}
```

---

*Reference Implementation: `/apps/server/src/modules/material`*
