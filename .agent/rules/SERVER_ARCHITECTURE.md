---
trigger: always_on
---

# Server Architecture Rules

Rules for maintaining the Ikki ERP server architecture. These rules ensure consistency, scalability, and correct dependency direction across all backend modules.

## Module Structure

Every module in `server/src/modules/` MUST follow this exact structure:

```
modules/<domain>/
├── dto/                    # Zod schemas (request/response contracts)
│   ├── index.ts            # Barrel export
│   └── <entity>.dto.ts     # Per-entity DTO file
├── router/                 # Elysia route definitions (thin controllers)
│   ├── index.ts            # Route composition + prefix
│   └── <entity>.route.ts   # Per-entity routes
├── service/                # Business logic
│   ├── index.ts            # ServiceModule class (facade)
│   └── <entity>.service.ts # Per-entity service class
└── index.ts                # Module barrel: export dto, router, service
```

### Barrel Exports

Module `index.ts` MUST export exactly:

```typescript
export * from "./dto"
export * from "./router"
export * from "./service"
```

Exception: `tool` module may skip `dto/` if it has no API contracts.

## Dependency Direction

### Layer Rules (STRICT — NEVER VIOLATE)

```
Layer 0 (Core):       location, product         ← ZERO dependencies
Layer 1 (Masters):    iam, materials             ← May depend on Layer 0 only
Layer 2 (Operations): inventory, recipe          ← May depend on Layer 0 + Layer 1
Layer 3 (Aggregators): dashboard, tool           ← May depend on any layer
```

### Import Rules

1. **NEVER create circular dependencies** between modules.
2. **NEVER import upward** (e.g., Layer 0 must NOT import from Layer 1).
3. **Depend on ServiceModule facade**, NOT internal service classes:

   ```typescript
   // ✅ CORRECT — depend on facade
   import type { MaterialServiceModule } from "@/modules/materials"

   // ❌ WRONG — deep import to internal class
   import type { MaterialLocationService } from "@/modules/materials/service/material-location.service"
   ```

4. **DTO cross-imports** are allowed ONLY for shared reference types (e.g., `LocationDto`). Minimize these.
5. **DB Schema** (`@/db/schema`) may be imported from any module for read-only JOINs. This is a pragmatic monolith decision.

### Write Authority

**ALL write operations** (INSERT, UPDATE, DELETE) to a table MUST go through the domain owner's service. No cross-module writes.

```typescript
// ✅ inventory delegates stock update to materials domain owner
await materialService.updateStock(materialId, locationId, stock, actorId)

// ❌ inventory writes directly to materialLocations table
await db.update(materialLocations).set(...)
```

## Service Pattern

### ServiceModule (Facade)

Each module's `service/index.ts` exports a `<Domain>ServiceModule` class that:

- Instantiates all internal services
- Wires internal dependencies via constructor
- Exposes public API as `readonly` properties
- Accepts cross-module dependencies via constructor params

```typescript
export class MaterialServiceModule {
  public readonly category: MaterialCategoryService
  public readonly uom: UomService
  public readonly material: MaterialService
  public readonly mLocation: MaterialLocationService

  constructor(locationServiceModule: LocationServiceModule) {
    this.category = new MaterialCategoryService()
    this.uom = new UomService()
    this.material = new MaterialService(this.category, this.uom)
    this.mLocation = new MaterialLocationService(
      this.material,
      locationServiceModule,
    )
  }
}
```

### Service Class Pattern

Individual service classes follow this structure:

```typescript
// 1. Imports (drizzle, lib utilities, DTOs)
// 2. Error constants
const err = {
  notFound: (id: number) => new NotFoundError(`Entity ${id} not found`, 'ENTITY_NOT_FOUND'),
}

// 3. Uniqueness fields (for checkConflict)
const uniqueFields: ConflictField<'code' | 'name'>[] = [...]

// 4. Cache keys
const cacheKey = {
  count: 'entity.count',
  list: 'entity.list',
  byId: (id: number) => `entity.byId.${id}`,
}

// 5. Service class
export class EntityService {
  constructor(private readonly depSvc: SomeDependency) {}

  // Internal queries (findById, findByX)
  async findById(id: number): Promise<EntityDto> { ... }

  // Handler methods (handleList, handleDetail, handleCreate, handleUpdate, handleRemove)
  async handleList(filter: FilterDto, pq: PaginationQuery): Promise<WithPaginationResult<SelectDto>> { ... }
  async handleCreate(data: CreateDto, actorId: number): Promise<{ id: number }> { ... }

  // Cache management
  private async clearCache(id: number) { ... }
}
```

### Key utilities to use:

- `paginate()` — parallel data + count queries
- `checkConflict()` — uniqueness validation
- `stampCreate(actorId)` / `stampUpdate(actorId)` — audit metadata
- `searchFilter(column, search)` — ILIKE search
- `sortBy(column, direction)` — order by helper
- `takeFirst()` / `takeFirstOrThrow()` — row extractors
- `record('span.name', fn)` — OpenTelemetry tracing
- `cache.wrap(key, fn)` — cache with fallback

## Router Pattern

Routers are thin controllers. They:

1. Define Elysia routes with Zod validation
2. Delegate ALL logic to service methods
3. Return standardized responses via `res.ok()`, `res.paginated()`, `res.created()`

```typescript
export function initEntityRoute(s: DomainServiceModule) {
  return new Elysia({ prefix: "/entity" }).use(authPluginMacro).get(
    "/list",
    async ({ query }) => {
      const result = await s.entity.handleList(query, query)
      return res.paginated(result)
    },
    {
      query: z.object({
        ...zHttp.pagination.shape,
        search: zHttp.query.search,
      }),
      response: zResponse.paginated(EntitySelectDto.array()),
      auth: true,
    },
  )
}
```

## DTO Pattern

DTOs follow a consistent structure per entity:

```typescript
// 1. Entity DTO (full DB representation)
export const EntityDto = z.object({ ... })

// 2. Filter DTO (query params for list)
export const EntityFilterDto = z.object({ ... })

// 3. Select DTO (API response — may omit/add fields)
export const EntitySelectDto = z.object({ ... })

// 4. Create DTO (input for creation)
export const EntityCreateDto = z.object({ ... })

// 5. Update DTO (input for update — usually partial of Create)
export const EntityUpdateDto = EntityCreateDto.partial()
```

Always export both schema AND type:

```typescript
export const EntityDto = z.object({ ... })
export type EntityDto = z.infer<typeof EntityDto>
```

## Shared Validators

Use centralized validators from `lib/validation/`:

- `zPrimitive` — base types (id, str, email, password, bool, num, date)
- `zHttp` — HTTP helpers (pagination, query params, recordId)
- `zResponse` — response wrappers (ok, paginated)
- `zSchema` — common schemas (recordId, metadata)
