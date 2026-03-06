---
description: How to add a new backend server module (e.g., purchasing, sales, accounting)
---

# Add New Server Module

// turbo-all

Follow these steps to add a new domain module to `server/src/modules/`.

## 1. Determine Module Layer

Before creating, determine which layer the new module belongs to:

- **Layer 0 (Core)**: No dependencies on other modules (e.g., `location`, `product`)
- **Layer 1 (Masters)**: May depend on Layer 0 (e.g., `iam`, `materials`)
- **Layer 2 (Operations)**: May depend on Layer 0 + Layer 1 (e.g., `inventory`, `recipe`)
- **Layer 3 (Aggregators)**: May depend on any (e.g., `dashboard`, `tool`)

## 2. Create Module Folder Structure

Create all required directories and files. Replace `<module>` with the module name (lowercase, singular or plural as appropriate):

```
server/src/modules/<module>/
├── dto/
│   ├── index.ts
│   └── <entity>.dto.ts
├── router/
│   ├── index.ts
│   └── <entity>.route.ts
├── service/
│   ├── index.ts
│   └── <entity>.service.ts
└── index.ts
```

## 3. Create DB Schema (if new tables needed)

1. Create `server/src/db/schema/<module>.ts` with Drizzle table definitions
2. Add tables to `server/src/db/schema/index.ts`:
   - Add import at the top
   - Add to `re-export` section
   - Add to `defineRelations()` call with relationships
3. Generate migration: `cd server && bun run db:generate`

## 4. Create DTOs

In `dto/<entity>.dto.ts`, define schemas following this exact order:

```typescript
import z from "zod"
import { zHttp, zPrimitive, zSchema } from "@/lib/validation"

// 1. Entity DTO (full DB row)
export const EntityDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  // ... all columns
  ...zSchema.metadata.shape,
})
export type EntityDto = z.infer<typeof EntityDto>

// 2. Filter DTO (list query params)
export const EntityFilterDto = z.object({
  search: zHttp.query.search,
  // ... other filters
})
export type EntityFilterDto = z.infer<typeof EntityFilterDto>

// 3. Select DTO (API response)
export const EntitySelectDto = z.object({
  ...EntityDto.shape,
  // add computed/joined fields, omit internal fields
})
export type EntitySelectDto = z.infer<typeof EntitySelectDto>

// 4. Create DTO (input for creation)
export const EntityCreateDto = z.object({
  name: zPrimitive.str,
  // ... writable fields only (no id, no metadata)
})
export type EntityCreateDto = z.infer<typeof EntityCreateDto>

// 5. Update DTO (partial of Create)
export const EntityUpdateDto = EntityCreateDto.partial()
export type EntityUpdateDto = z.infer<typeof EntityUpdateDto>
```

Create `dto/index.ts` barrel:

```typescript
export * from "./<entity>.dto"
```

## 5. Create Service

In `service/<entity>.service.ts`, follow this structure:

```typescript
import { record } from "@elysiajs/opentelemetry"
import { and, count, eq } from "drizzle-orm"

import { cache } from "@/lib/cache"
import {
  checkConflict,
  paginate,
  searchFilter,
  sortBy,
  stampCreate,
  stampUpdate,
  takeFirstOrThrow,
  type ConflictField,
} from "@/lib/db"
import { NotFoundError } from "@/lib/error/http"
import type {
  PaginationQuery,
  WithPaginationResult,
} from "@/lib/utils/pagination"

import { db } from "@/db"
import { myTable } from "@/db/schema"

import type {
  EntityCreateDto,
  EntityDto,
  EntityFilterDto,
  EntitySelectDto,
  EntityUpdateDto,
} from "../dto"

const err = {
  notFound: (id: number) =>
    new NotFoundError(`Entity ${id} not found`, "ENTITY_NOT_FOUND"),
}

const uniqueFields: ConflictField<"name">[] = [
  {
    field: "name",
    column: myTable.name,
    message: "Name already exists",
    code: "ENTITY_NAME_ALREADY_EXISTS",
  },
]

const cacheKey = {
  count: "entity.count",
  list: "entity.list",
  byId: (id: number) => `entity.byId.${id}`,
}

export class EntityService {
  // constructor with DI if needed

  async findById(id: number): Promise<EntityDto> {
    return record("EntityService.findById", () =>
      cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(myTable).where(eq(myTable.id, id))
        return takeFirstOrThrow(
          result,
          `Entity ${id} not found`,
          "ENTITY_NOT_FOUND",
        )
      }),
    )
  }

  async handleList(
    filter: EntityFilterDto,
    pq: PaginationQuery,
  ): Promise<WithPaginationResult<EntitySelectDto>> {
    return record("EntityService.handleList", async () => {
      const where = and(searchFilter(myTable.name, filter.search))
      return paginate({
        data: ({ limit, offset }) =>
          db
            .select()
            .from(myTable)
            .where(where)
            .orderBy(sortBy(myTable.updatedAt, "desc"))
            .limit(limit)
            .offset(offset),
        pq,
        countQuery: db.select({ count: count() }).from(myTable).where(where),
      })
    })
  }

  async handleDetail(id: number): Promise<EntitySelectDto> {
    return record("EntityService.handleDetail", () => this.findById(id))
  }

  async handleCreate(
    data: EntityCreateDto,
    actorId: number,
  ): Promise<{ id: number }> {
    return record("EntityService.handleCreate", async () => {
      await checkConflict({
        table: myTable,
        pkColumn: myTable.id,
        fields: uniqueFields,
        input: data,
      })
      const [result] = await db
        .insert(myTable)
        .values({ ...data, ...stampCreate(actorId) })
        .returning({ id: myTable.id })
      void this.clearCache()
      return result
    })
  }

  async handleUpdate(
    id: number,
    data: EntityUpdateDto,
    actorId: number,
  ): Promise<{ id: number }> {
    return record("EntityService.handleUpdate", async () => {
      const existing = await this.findById(id)
      await checkConflict({
        table: myTable,
        pkColumn: myTable.id,
        fields: uniqueFields,
        input: data,
        existing,
      })
      await db
        .update(myTable)
        .set({ ...data, ...stampUpdate(actorId) })
        .where(eq(myTable.id, id))
      void this.clearCache(id)
      return { id }
    })
  }

  async handleRemove(id: number): Promise<{ id: number }> {
    return record("EntityService.handleRemove", async () => {
      await this.findById(id)
      await db.delete(myTable).where(eq(myTable.id, id))
      void this.clearCache(id)
      return { id }
    })
  }

  private async clearCache(id?: number) {
    const keys = [cacheKey.count, cacheKey.list]
    if (id) keys.push(cacheKey.byId(id))
    await Promise.all(keys.map((k) => cache.del(k)))
  }
}
```

Create ServiceModule facade in `service/index.ts`:

```typescript
export class ModuleServiceModule {
  public readonly entity: EntityService

  constructor(/* cross-module deps if needed */) {
    this.entity = new EntityService()
  }
}
```

## 6. Create Router

In `router/<entity>.route.ts`:

```typescript
import { Elysia } from "elysia"
import { z } from "zod"

import { authPluginMacro } from "@/lib/elysia/auth-plugin"
import { res } from "@/lib/utils/response.util"
import { zHttp, zPrimitive, zResponse, zSchema } from "@/lib/validation"

import { EntityCreateDto, EntitySelectDto, EntityUpdateDto } from "../dto"
import type { ModuleServiceModule } from "../service"

export function initEntityRoute(s: ModuleServiceModule) {
  return new Elysia({ prefix: "/entity" })
    .use(authPluginMacro)
    .get(
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
    .get(
      "/detail",
      async ({ query }) => {
        const data = await s.entity.handleDetail(query.id)
        return res.ok(data)
      },
      {
        query: zHttp.recordId,
        response: zResponse.ok(EntitySelectDto),
        auth: true,
      },
    )
    .post(
      "/create",
      async ({ body, auth }) => {
        const result = await s.entity.handleCreate(body, auth.userId)
        return res.created(result, "ENTITY_CREATED")
      },
      {
        body: EntityCreateDto,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      },
    )
    .put(
      "/update",
      async ({ body, auth }) => {
        const result = await s.entity.handleUpdate(body.id, body, auth.userId)
        return res.ok(result, "ENTITY_UPDATED")
      },
      {
        body: z.object({ id: zPrimitive.id, ...EntityUpdateDto.shape }),
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      },
    )
    .delete(
      "/delete",
      async ({ body }) => {
        const result = await s.entity.handleRemove(body.id)
        return res.ok(result, "ENTITY_DELETED")
      },
      {
        body: zSchema.recordId,
        response: zResponse.ok(zSchema.recordId),
        auth: true,
      },
    )
}
```

Create router module composer in `router/index.ts`:

```typescript
import { Elysia } from "elysia"
import type { ModuleServiceModule } from "../service"
import { initEntityRoute } from "./<entity>.route"

export function initModuleRouteModule(s: ModuleServiceModule) {
  return new Elysia({ prefix: "/<module>" }).use(initEntityRoute(s))
}
```

## 7. Create Module Barrel

`modules/<module>/index.ts`:

```typescript
export * from "./dto"
export * from "./router"
export * from "./service"
```

## 8. Register in App

In `server/src/app.ts`:

1. **Import** the service module and route initializer
2. **Instantiate** the service module (respecting layer dependency order)
3. **Initialize** the route module
4. **Register** the route with `.use()`

```typescript
// Import
import { initModuleRouteModule, ModuleServiceModule } from "@/modules/<module>"

// Instantiate (after its dependencies)
const moduleService = new ModuleServiceModule(/* deps */)

// Initialize route
const moduleRoute = initModuleRouteModule(moduleService)
  // Register (add to the Elysia app chain)
  .use(moduleRoute)
```

## 9. Verify

1. Run `cd server && bun run dev` to check boot
2. Run `cd server && bun run typecheck` to verify types
3. Test endpoints manually or via API client
