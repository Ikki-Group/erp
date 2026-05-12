# Material Module Architecture Review

## Executive Summary

Analysis of `apps/server/src/modules/material` as R&D sample for future module architecture standardization.

---

## Current Structure

```
material/
├── index.ts                           # ServiceModule + RouteModule
├── material-category/
│   ├── material-category.dto.ts
│   ├── material-category.repo.ts
│   ├── material-category.route.ts
│   └── material-category.service.ts
├── material-conversion/
├── material-location/
├── material-master/
├── material-query/
└── uom/
```

---

## Critical Issues Found

### 1. **Direct Database Access (HIGH)**

`@/apps/server/src/modules/material/material-master/material.service.ts:105-121`

```typescript
// ❌ BAD: Direct db import bypassing injected DbClient
import { db } from '@/db'

// In getMaterialsBatchWithRelations():
const [conversions, locations] = await Promise.all([
    db.select({...}).from(materialConversionsTable),  // Direct access!
    db.select({...}).from(materialLocationsTable),    // Direct access!
])
```

**Impact**: Breaks transaction boundaries, prevents test mocking, violates DI principle.

---

### 2. **Inconsistent Cache Namespace (MEDIUM)**

| Sub-module | Current Namespace | Issue |
|------------|-------------------|-------|
| material-category | `material-category` | Inconsistent prefix |
| material-master | `material` | Too generic |
| uom | `material.uom` | Dot notation (inconsistent) |
| material-location | `material.location` | Dot notation |
| material-conversion | `material.conversion` | Dot notation |

Compare to IAM: `iam.user`, `iam.role` — consistent hierarchical pattern.

---

### 3. **No Centralized Error Definitions (MEDIUM)**

```typescript
// ❌ BAD: Inline error objects in each service
const err = {
    notFound: (id: number) => new NotFoundError(...),
    createFailed: () => new InternalServerError(...),
}
```

Compare to IAM: `@/apps/server/src/modules/iam/errors.ts` — centralized, reusable.

---

### 4. **Missing Readonly DI (MEDIUM)**

```typescript
// ❌ BAD: Modifiable dependencies
constructor(
    private readonly categorySvc: MaterialCategoryService,
    private readonly conversionSvc: MaterialConversionService,
    private readonly repo: MaterialRepo,
    cacheClient: CacheClient,  // Missing readonly!
)
```

---

### 5. **Inconsistent Method Naming (LOW)**

| Service | List Method |
|---------|-------------|
| MaterialCategoryService | `getList()` |
| MaterialService | `find()` |
| LocationMasterService | `getList()` |

---

### 6. **No Cache Key Constants Usage (LOW)**

```typescript
// ❌ BAD: Hardcoded strings
await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

// ✅ GOOD (from shared/cache-keys.ts)
await this.cache.deleteMany({ 
    keys: [CACHE_KEY.LIST, CACHE_KEY.COUNT, CACHE_KEY.BY_ID(id)] 
})
```

---

## Pattern Comparison: Material vs IAM vs Location

| Aspect | Material | IAM | Location |
|--------|----------|-----|----------|
| Error Centralization | ❌ Inline | ✅ `errors.ts` | ✅ Inline (acceptable for small) |
| Cache Namespace | ❌ Inconsistent | ✅ `iam.user`, `iam.role` | ✅ `location` |
| Readonly DI | ❌ Partial | ✅ Full | ✅ Full |
| Cross-module Access | ❌ Leaks repos | ✅ Services only | N/A (base layer) |
| Constants File | ❌ None | ✅ `constants.ts` | N/A |

---

## Positive Patterns to Preserve

1. **Feature-based folder structure** — Clean separation per domain
2. **ServiceModule pattern** — Good DI container approach
3. **DTO co-location** — DTOs next to their features
4. **Handler method naming** — `handleCreate`, `handleUpdate`, `handleRemove`
5. **OpenTelemetry tracing** — `record()` wrapper usage
6. **Conflict checking pattern** — `checkConflict()` from core

---

## Recommended Architecture Blueprint

### File Structure (Feature-Based)

```
modules/
├── material/
│   ├── index.ts              # ServiceModule + RouteModule exports
│   ├── constants.ts          # Module-level constants
│   ├── errors.ts             # Centralized error factories
│   ├── types.ts              # Shared types/interfaces
│   ├── cache-config.ts       # Cache namespaces & keys
│   │
│   └── features/             # Sub-features
│       ├── category/
│       │   ├── index.ts      # Re-exports
│       │   ├── dto.ts
│       │   ├── repo.ts
│       │   ├── service.ts
│       │   └── route.ts
│       ├── uom/
│       ├── master/
│       ├── location/
│       └── conversion/
```

### Service Pattern

```typescript
// constants.ts
export const MATERIAL_CACHE_NS = {
  CATEGORY: 'material:category',
  UOM: 'material:uom', 
  MASTER: 'material:master',
  LOCATION: 'material:location',
  CONVERSION: 'material:conversion',
} as const

// errors.ts
export const MaterialErrors = {
  notFound: (id: number) => 
    new NotFoundError(`Material ${id} not found`, 'MATERIAL_NOT_FOUND'),
  // ...
}

// cache-config.ts
export const CACHE_KEY_DEFAULT = {
  LIST: 'list',
  COUNT: 'count', 
  BY_ID: (id: number | string) => `byId:${id}`,
} as const

// service.ts
export class MaterialService {
  private readonly cache: CacheService
  
  constructor(
    private readonly deps: {
      category: MaterialCategoryService
      conversion: MaterialConversionService
    },
    private readonly repo: MaterialRepo,
    cacheClient: CacheClient,
  ) {
    this.cache = new CacheService({
      ns: MATERIAL_CACHE_NS.MASTER,
      client: cacheClient,
    })
  }
  
  // Public read methods
  async getList(): Promise<MaterialDto[]>
  async getById(id: number): Promise<MaterialDto | undefined>
  async getDetailById(id: number): Promise<MaterialDetailDto | undefined>
  async count(): Promise<number>
  async getRelationMap(): Promise<RelationMap<number, MaterialDto>>
  
  // Cross-module batch operation
  async getBatch(ids: number[]): Promise<MaterialDto[]>
  async getBatchWithRelations(ids: number[]): Promise<MaterialDetailDto[]>
  
  // Handlers (mutations)
  async handleCreate(data: MaterialCreateDto, actorId: number): Promise<RecordId>
  async handleUpdate(id: number, data: MaterialUpdateDto, actorId: number): Promise<RecordId>
  async handleRemove(id: number): Promise<RecordId>
}
```

### Module Index Pattern

```typescript
// index.ts
export class MaterialServiceModule {
  public readonly category: MaterialCategoryService
  public readonly uom: UomService
  public readonly master: MaterialService
  public readonly location: MaterialLocationService
  public readonly conversion: MaterialConversionService

  constructor(
    private readonly db: DbClient,
    private readonly cacheClient: CacheClient,
    private readonly deps: {
      location: LocationMasterService
    },
  ) {
    // Initialize in dependency order
    const categoryRepo = new MaterialCategoryRepo(this.db)
    this.category = new MaterialCategoryService(
      { repo: categoryRepo },
      this.cacheClient,
    )

    const uomRepo = new UomRepo(this.db)
    this.uom = new UomService({ repo: uomRepo }, this.cacheClient)

    const conversionRepo = new MaterialConversionRepo(this.db)
    this.conversion = new MaterialConversionService(
      { repo: conversionRepo },
      this.db,  // For transactions
      this.cacheClient,
    )

    const masterRepo = new MaterialRepo(this.db)
    this.master = new MaterialService(
      { 
        category: this.category,
        conversion: this.conversion,
        repo: masterRepo,
      },
      this.cacheClient,
    )

    const locationRepo = new MaterialLocationRepo(this.db)
    this.location = new MaterialLocationService(
      {
        master: this.master,
        location: this.deps.location,
        repo: locationRepo,
      },
      this.cacheClient,
    )
  }
}

export function initMaterialRouteModule(s: MaterialServiceModule) {
  return new Elysia({ prefix: '/material' })
    .use(initMaterialCategoryRoute(s.category))
    .use(initUomRoute(s.uom))
    .use(initMaterialConversionRoute(s.conversion))
    .use(initMaterialLocationRoute(s.location))
    .use(initMaterialMasterRoute(s.master))
}

// Re-exports
export { ... } from './features/category/dto'
export { ... } from './features/master/dto'
export type { MaterialCategoryService } from './features/category/service'
export type { MaterialService } from './features/master/service'
```

---

## Implementation Priority

### Phase 1: Foundation (Must Fix)
1. Fix direct `db` import → Use injected `DbClient` via transaction parameter
2. Add `constants.ts` with standardized cache namespaces
3. Add `errors.ts` with centralized error factories
4. Add `readonly` to all DI dependencies

### Phase 2: Standardization
5. Migrate to `CACHE_KEY_DEFAULT` constants
6. Standardize method names (`getList` not `find`)
7. Reorganize folder structure to `features/` subfolder

### Phase 3: Cross-Module Safety
8. Ensure no service directly accesses another module's repo
9. Expose only public service methods for cross-module operations
10. Document public API surface in module README

---

## Success Metrics

- [ ] No direct `db` imports in any service
- [ ] All cache namespaces follow `{module}:{feature}` pattern
- [ ] All DI dependencies marked `readonly`
- [ ] Centralized error definitions
- [ ] Consistent method naming across all services
- [ ] Zero cross-module repo access (services only)
- [ ] Full test coverage for new patterns

---

*Generated: Architecture Review for Material Module R&D*
