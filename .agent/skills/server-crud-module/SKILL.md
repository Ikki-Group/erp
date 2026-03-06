---
name: server-crud-module
description: Generate a complete server CRUD module with DTO, Service, Router following Ikki ERP patterns
---

# Server CRUD Module Generator

This skill helps you generate a complete backend module with full CRUD operations following the Ikki ERP architecture patterns.

## When to Use

Use this skill when:

- Adding a new domain module to the server (e.g., purchasing, sales, accounting, HR)
- Adding a new entity within an existing module
- Need to scaffold a complete DTO + Service + Router for an entity

## Prerequisites

Before using this skill:

1. Ensure the DB schema table exists (use `/add-db-schema` workflow if not)
2. Determine the module layer (see Layer Rules in `SERVER_ARCHITECTURE.md`)
3. Identify any cross-module dependencies the new module needs

## Input Required

When asked to create a module, gather this information:

- **Module name**: e.g., `purchasing`, `sales`
- **Entity name(s)**: e.g., `PurchaseOrder`, `Vendor`
- **Table name**: The Drizzle table reference in `@/db/schema`
- **Fields**: Columns and their Zod types
- **Unique fields**: Which fields need uniqueness checks
- **Dependencies**: Which other ServiceModules it depends on
- **Layer**: Which architectural layer (0-3)

## Generation Steps

### Step 1: DTO File

Create `modules/<module>/dto/<entity>.dto.ts`:

```typescript
import z from 'zod'
import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const <Entity>Dto = z.object({
  id: zPrimitive.id,
  // ... all DB columns mapped to Zod types
  ...zSchema.metadata.shape,
})
export type <Entity>Dto = z.infer<typeof <Entity>Dto>

/* --------------------------------- FILTER --------------------------------- */

export const <Entity>FilterDto = z.object({
  search: zHttp.query.search,
  // ... filter-specific fields with zHttp.query helpers
})
export type <Entity>FilterDto = z.infer<typeof <Entity>FilterDto>

/* --------------------------------- SELECT --------------------------------- */

export const <Entity>SelectDto = z.object({
  ...<Entity>Dto.shape,
  // Add joined / computed fields
  // Omit internal fields if needed
})
export type <Entity>SelectDto = z.infer<typeof <Entity>SelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const <Entity>CreateDto = z.object({
  // Only writable fields (no id, no metadata)
})
export type <Entity>CreateDto = z.infer<typeof <Entity>CreateDto>

export const <Entity>UpdateDto = <Entity>CreateDto.partial()
export type <Entity>UpdateDto = z.infer<typeof <Entity>UpdateDto>
```

**Key Rules**:

- Use `zPrimitive` for all base types (id, str, num, bool, etc.)
- Use `zSchema.metadata.shape` spread for audit fields
- Always export both schema and type with same name
- Organize with comment sections: ENTITY, FILTER, SELECT, MUTATION

### Step 2: Service File

Create `modules/<module>/service/<entity>.service.ts`:

Use these patterns consistently:

- **Error constants** at module level (not inside class)
- **Cache keys** at module level
- **Uniqueness fields** at module level
- **record()** wrapper for OTEL tracing on every public method
- **cache.wrap()** for read operations (findById, count)
- **clearCache()** after any write operation
- **Naming**: `handleList`, `handleDetail`, `handleCreate`, `handleUpdate`, `handleRemove`

### Step 3: ServiceModule Facade

Create `modules/<module>/service/index.ts`:

```typescript
import type { DependencyServiceModule } from '@/modules/dependency'
import { EntityService } from './<entity>.service'

export class <Module>ServiceModule {
  public readonly entity: EntityService

  constructor(depSvc: DependencyServiceModule) {
    this.entity = new EntityService(depSvc)
  }
}
```

**Rules**:

- Cross-module dependencies passed via constructor
- Import dependencies as `type` only
- All services exposed as `readonly` properties

### Step 4: Router File

Create `modules/<module>/router/<entity>.route.ts`:

Standard CRUD routes:
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/list` | `handleList(query, query)` | ✅ |
| GET | `/detail` | `handleDetail(query.id)` | ✅ |
| POST | `/create` | `handleCreate(body, auth.userId)` | ✅ |
| PUT | `/update` | `handleUpdate(body.id, body, auth.userId)` | ✅ |
| DELETE | `/delete` | `handleRemove(body.id)` | ✅ |

Response helpers:

- List → `res.paginated(result)`
- Detail → `res.ok(data)`
- Create → `res.created(result, 'ENTITY_CREATED')`
- Update → `res.ok(result, 'ENTITY_UPDATED')`
- Delete → `res.ok(result, 'ENTITY_DELETED')`

### Step 5: Router Module Composer

Create `modules/<module>/router/index.ts`:

```typescript
import { Elysia } from 'elysia'
import type { <Module>ServiceModule } from '../service'
import { initEntityRoute } from './<entity>.route'

export function init<Module>RouteModule(s: <Module>ServiceModule) {
  return new Elysia({ prefix: '/<module>' })
    .use(initEntityRoute(s))
}
```

### Step 6: Barrel Exports

Create `modules/<module>/dto/index.ts`:

```typescript
export * from "./<entity>.dto"
```

Create `modules/<module>/index.ts`:

```typescript
export * from "./dto"
export * from "./router"
export * from "./service"
```

### Step 7: Register in App

Edit `server/src/app.ts`:

1. Import ServiceModule and initRouteModule
2. Instantiate service (respect layer order)
3. Init route
4. Add `.use(route)` to app chain

## Validation Checklist

After generation, verify:

- [ ] All DTOs export both schema AND type
- [ ] Service uses `record()` for OTEL on all public methods
- [ ] Service uses `cache.wrap()` for reads and `clearCache()` for writes
- [ ] Router uses `authPluginMacro` and sets `auth: true`
- [ ] Router response schemas match what handlers return
- [ ] No `any` types — use proper Zod inferences
- [ ] Module barrel exports dto, router, service
- [ ] Cross-module imports use facade only (not internal service classes)
- [ ] Layer dependency rules are respected

## Common Patterns Reference

### Scoped Uniqueness (unique within parent)

```typescript
// Check uniqueness within a parent scope
const where = and(
  eq(table.parentId, data.parentId),
  eq(table.code, data.code),
  existing ? ne(table.id, existing.id) : undefined,
)
const [conflict] = await db.select().from(table).where(where).limit(1)
if (conflict) throw new ConflictError("Code already exists", "CODE_EXISTS")
```

### Nested Create (parent + children in transaction)

```typescript
await db.transaction(async (tx) => {
  const [parent] = await tx.insert(parentTable).values({ ... }).returning({ id: parentTable.id })
  if (children.length > 0) {
    await tx.insert(childTable).values(
      children.map((c) => ({ ...c, parentId: parent.id, ...stampCreate(actorId) }))
    )
  }
  return parent
})
```

### Enriched List (JOIN for display fields)

```typescript
const result = await paginate({
  data: ({ limit, offset }) =>
    db
      .select({
        ...getTableColumns(mainTable),
        parentName: parentTable.name,
      })
      .from(mainTable)
      .innerJoin(parentTable, eq(mainTable.parentId, parentTable.id))
      .where(where)
      .orderBy(sortBy(mainTable.updatedAt, "desc"))
      .limit(limit)
      .offset(offset),
  pq,
  countQuery: db.select({ count: count() }).from(mainTable).where(where),
})
```
