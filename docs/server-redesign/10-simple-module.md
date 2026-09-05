# Golden Path — Simple Module (`location`)

The complete, copy-paste reference for a **simple** module (one entity, CRUD). Every simple module (`location`, `uom`, `supplier`, `payment-method`, ...) follows this shape exactly — change only the names. Read [00-glossary.md](./00-glossary.md) and specs [02](./02-transaction-uow.md)–[09](./09-module-registry.md) first.

> **How to use this:** copy the whole `location/` folder, rename `location`→`<yourEntity>` and `Location`→`<YourEntity>`, adjust the fields. Do not invent new structure.

## Folder

```
modules/location/
├── domain/
│   ├── location.ts            # entity type + row→entity mapping helpers (pure)
│   ├── location.rules.ts      # invariants (pure, assert*)
│   └── location.errors.ts     # error factories
├── contract/
│   └── location.dto.ts        # Zod DTOs
├── app/
│   ├── ports.ts               # LocationRepoPort
│   ├── create-location.usecase.ts
│   ├── update-location.usecase.ts
│   ├── delete-location.usecase.ts
│   ├── get-location.usecase.ts
│   └── list-location.usecase.ts
├── infra/
│   └── location.repo.drizzle.ts
├── http/
│   └── location.route.ts
└── location.module.ts         # descriptor (see 09)
```

> A simple module has **no** `read/` folder — its reads (`get`, `list`) are plain use-cases backed by repo methods. `read/` is only for heavy/enriched views (complex modules).

---

## 1. `contract/location.dto.ts`

```ts
import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema/index.ts'

export const LocationTypeEnum = z.enum(['store', 'warehouse'])

const LocationMutationDto = z.object({
  code: zc.strTrim.max(50),
  name: zc.strTrim.min(3).max(100),
  type: LocationTypeEnum,
  address: zc.strTrimNullable,
  phone: zc.strTrimNullable,
  isActive: zp.bool.default(true),        // native boolean (ADR-0008)
})

export const LocationDto = z.object({
  id: zp.id,
  code: zp.str,
  name: zp.str,
  type: LocationTypeEnum,
  address: z.string().nullable(),
  phone: z.string().nullable(),
  isActive: zp.bool,
  ...zc.AuditBasic.shape,
})
export type LocationDto = z.infer<typeof LocationDto>

export const LocationCreateDto = LocationMutationDto
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

export const LocationUpdateDto = z.object({ id: zp.id, ...LocationMutationDto.shape })
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>

export const LocationFilterDto = z.object({
  ...zq.pagination.shape,
  q: zq.search,
  type: LocationTypeEnum.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>
```

## 2. `domain/location.ts`

```ts
import type { LocationDto } from '../contract/location.dto.ts'

/** Domain entity = the DTO shape here (no money/qty on this entity). */
export type Location = LocationDto

/** Pure row→entity mapping. Booleans are native now — no `=== 1`. */
export function rowToLocation(row: {
  id: number; code: string; name: string; type: 'store' | 'warehouse'
  address: string | null; phone: string | null; isActive: boolean
  createdAt: Date; updatedAt: Date; createdBy: number | null; updatedBy: number | null
}): Location {
  return { ...row }
}
```

## 3. `domain/location.rules.ts`

```ts
// Pure invariants. `assert*` functions throw typed errors (07-audit-errors).
// Location has no cross-field invariants beyond uniqueness (handled at repo/app via conflict check),
// so this file may be empty for now. Kept for shape consistency and future rules.
export {}
```

## 4. `domain/location.errors.ts`

```ts
import { ConflictError, InternalServerError, NotFoundError } from '@/shared/errors/http-error.ts'

export const LocationError = {
  notFound: (id: number) =>
    new NotFoundError('Location not found', { code: 'LOCATION_NOT_FOUND', context: { id } }),
  codeExists: () =>
    new ConflictError('Code already exists', { code: 'LOCATION_CODE_EXISTS' }),
  nameExists: () =>
    new ConflictError('Name already exists', { code: 'LOCATION_NAME_EXISTS' }),
  createFailed: () =>
    new InternalServerError('Location creation failed', { code: 'LOCATION_CREATE_FAILED' }),
  updateFailed: (id: number) =>
    new InternalServerError('Location update failed', { code: 'LOCATION_UPDATE_FAILED', context: { id } }),
  deleteFailed: (id: number) =>
    new InternalServerError('Location delete failed', { code: 'LOCATION_DELETE_FAILED', context: { id } }),
}
```

## 5. `app/ports.ts`

```ts
import type { DbContext, Tx } from '@/infra/database/client.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { WithPaginationResult } from '@/shared/types/pagination.ts'
import type { Location } from '../domain/location.ts'
import type { LocationCreateDto, LocationFilterDto, LocationUpdateDto } from '../contract/location.dto.ts'

export interface LocationRepoPort {
  readonly db: DbContext
  findById(id: number, cx?: DbContext | Tx): Promise<Location | undefined>
  findPage(filter: LocationFilterDto, cx?: DbContext | Tx): Promise<WithPaginationResult<Location>>
  insert(data: LocationCreateDto, actorId: number, cx?: DbContext | Tx): Promise<EntityRef | undefined>
  update(id: number, data: Omit<LocationUpdateDto, 'id'>, actorId: number, cx?: DbContext | Tx): Promise<EntityRef | undefined>
  softDelete(id: number, actorId: number, cx?: DbContext | Tx): Promise<EntityRef | undefined>
  /** Throws LocationError.codeExists/nameExists if a conflict is found. */
  assertNoConflict(data: { code: string; name: string }, excludeId: number | undefined, cx: DbContext | Tx): Promise<void>
}
```

## 6. `infra/location.repo.drizzle.ts`

```ts
import { eq, and, ne, sql } from 'drizzle-orm'
import { locations } from '@/db/schema/core.ts'
import type { DbContext, Tx } from '@/infra/database/client.ts'
import { takeFirst, toLimitOffset, buildPaginationMeta, allOf, eqIf, searchAcross } from '@/infra/database/index.ts'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { LocationRepoPort } from '../app/ports.ts'
import { rowToLocation } from '../domain/location.ts'
import { LocationError } from '../domain/location.errors.ts'
import type { LocationCreateDto, LocationFilterDto, LocationUpdateDto } from '../contract/location.dto.ts'

export class LocationRepoDrizzle implements LocationRepoPort {
  constructor(readonly db: DbContext) {}

  async findById(id: number, cx: DbContext | Tx = this.db) {
    const row = await cx.select().from(locations).where(eq(locations.id, id)).limit(1).then(takeFirst)
    return row ? rowToLocation(row) : undefined
  }

  async findPage(filter: LocationFilterDto, cx: DbContext | Tx = this.db) {
    const where = allOf(searchAcross(filter.q, [locations.code, locations.name]), eqIf(locations.type, filter.type))
    const { limit, offset } = toLimitOffset(filter)
    const rows = await cx
      .select({ /* explicit columns */ ...locations, rowCount: sql<number>`count(*) over()`.as('row_count') })
      .from(locations).where(where).orderBy(sql`${locations.id} desc`).limit(limit).offset(offset)
    const total = rows[0]?.rowCount ?? 0
    return { data: rows.map(rowToLocation), meta: buildPaginationMeta(filter.page, filter.limit, total) }
  }

  async insert(data: LocationCreateDto, actorId: number, cx: DbContext | Tx = this.db): Promise<EntityRef | undefined> {
    const [res] = await cx.insert(locations).values({ ...data, ...stampCreate(actorId) }).returning({ id: locations.id })
    return res
  }

  async update(id: number, data: Omit<LocationUpdateDto, 'id'>, actorId: number, cx: DbContext | Tx = this.db) {
    const [res] = await cx.update(locations).set({ ...data, ...stampUpdate(actorId) })
      .where(eq(locations.id, id)).returning({ id: locations.id })
    return res
  }

  async softDelete(id: number, actorId: number, cx: DbContext | Tx = this.db) {
    const [res] = await cx.update(locations).set({ isActive: false, ...stampUpdate(actorId) })
      .where(eq(locations.id, id)).returning({ id: locations.id })
    return res
  }

  async assertNoConflict(data: { code: string; name: string }, excludeId: number | undefined, cx: DbContext | Tx) {
    const notSelf = excludeId ? ne(locations.id, excludeId) : undefined
    const byCode = await cx.select({ id: locations.id }).from(locations).where(and(eq(locations.code, data.code), notSelf)).limit(1).then(takeFirst)
    if (byCode) throw LocationError.codeExists()
    const byName = await cx.select({ id: locations.id }).from(locations).where(and(eq(locations.name, data.name), notSelf)).limit(1).then(takeFirst)
    if (byName) throw LocationError.nameExists()
  }
}
```

## 7. `app/*.usecase.ts`

```ts
// app/create-location.usecase.ts
import type { UnitOfWork } from '@/shared/uow/uow.port.ts'
import type { CachePort } from '@/shared/cache/cache.port.ts'
import type { AuditPort } from '@/shared/audit/audit.port.ts'
import type { Actor } from '@/shared/auth/actor.ts'
import type { EntityRef } from '@/shared/types/utils.ts'
import type { LocationRepoPort } from './ports.ts'
import type { LocationCreateDto } from '../contract/location.dto.ts'
import { LocationError } from '../domain/location.errors.ts'

export interface CreateLocationDeps {
  uow: UnitOfWork; repo: LocationRepoPort; audit: AuditPort; cache: CachePort
}

export function makeCreateLocation(deps: CreateLocationDeps) {
  return async (input: LocationCreateDto, actor: Actor): Promise<EntityRef> => {
    const ref = await deps.uow.run(async (tx) => {
      await deps.repo.assertNoConflict({ code: input.code, name: input.name }, undefined, tx)
      const written = await deps.repo.insert(input, actor.id, tx)
      if (!written) throw LocationError.createFailed()
      await deps.audit.record({
        actorId: actor.id, actorName: actor.name, locationId: actor.locationId,
        module: 'location', entity: 'location', entityId: written.id, action: 'create',
        summary: `Created location "${input.name}" (${input.code})`,
        newValues: { code: input.code, name: input.name, type: input.type },
      }, tx)
      return written
    })
    await deps.cache.invalidate('location', ref.id)
    return ref
  }
}
```

```ts
// app/update-location.usecase.ts  (same shape; assertNoConflict excludes self)
export function makeUpdateLocation(deps: UpdateLocationDeps) {
  return async (input: LocationUpdateDto, actor: Actor): Promise<EntityRef> => {
    const { id, ...data } = input
    const ref = await deps.uow.run(async (tx) => {
      const existing = await deps.repo.findById(id, tx)
      if (!existing) throw LocationError.notFound(id)
      await deps.repo.assertNoConflict({ code: data.code, name: data.name }, id, tx)
      const written = await deps.repo.update(id, data, actor.id, tx)
      if (!written) throw LocationError.updateFailed(id)
      await deps.audit.record({ /* action: 'update', ... */ }, tx)
      return written
    })
    await deps.cache.invalidate('location', ref.id)
    return ref
  }
}
```

```ts
// app/delete-location.usecase.ts  (soft delete)
export function makeDeleteLocation(deps: DeleteLocationDeps) {
  return async (id: number, actor: Actor): Promise<EntityRef> => {
    const ref = await deps.uow.run(async (tx) => {
      const existing = await deps.repo.findById(id, tx)
      if (!existing) throw LocationError.notFound(id)
      const written = await deps.repo.softDelete(id, actor.id, tx)
      if (!written) throw LocationError.deleteFailed(id)
      await deps.audit.record({ /* action: 'delete', ... */ }, tx)
      return written
    })
    await deps.cache.invalidate('location', ref.id)
    return ref
  }
}
```

```ts
// app/get-location.usecase.ts   (read — NO uow)
export function makeGetLocation(deps: { repo: LocationRepoPort; cache: CachePort }) {
  return async (id: number): Promise<LocationDto> => {
    const found = await deps.cache.getOrSetOptional('location', `byId:${id}`, () => deps.repo.findById(id))
    if (!found) throw LocationError.notFound(id)
    return found
  }
}

// app/list-location.usecase.ts  (read — NO uow)
export function makeListLocation(deps: { repo: LocationRepoPort }) {
  return (filter: LocationFilterDto) => deps.repo.findPage(filter)
}
```

## 8. `http/location.route.ts`

```ts
import { Elysia } from 'elysia'
import { rbac } from '@/server/plugins/rbac.plugin.ts'
import { actorOf } from '@/shared/auth/actor.ts'
import { res } from '@/shared/http/response.ts'
import { zq } from '@/shared/schema/index.ts'
import { LocationCreateDto, LocationFilterDto, LocationUpdateDto } from '../contract/location.dto.ts'
import type { LocationUseCases } from '../location.module.ts'

export function createLocationRoute(uc: LocationUseCases) {
  return new Elysia({ prefix: '/location' })
    .use(rbac)
    .get('/list', async ({ query }) => res.paginated(await uc.list(query)),
      { query: LocationFilterDto, permission: 'location.read' })
    .get('/detail', async ({ query }) => res.ok(await uc.get(query.id)),
      { query: zq.recordId, permission: 'location.read' })
    .post('/create', async ({ body, auth }) => res.created(await uc.create(body, actorOf(auth))),
      { body: LocationCreateDto, permission: 'location.create' })
    .put('/update', async ({ body, auth }) => res.ok(await uc.update(body, actorOf(auth))),
      { body: LocationUpdateDto, permission: 'location.update' })
    .delete('/delete', async ({ query, auth }) => res.ok(await uc.remove(query.id, actorOf(auth))),
      { query: zq.recordId, permission: 'location.delete' })
}
```

## 9. `location.module.ts` (descriptor — see [09](./09-module-registry.md))

```ts
import type { ModuleDescriptor, ModuleContext } from '@/shared/module/registry.ts'
import { LocationRepoDrizzle } from './infra/location.repo.drizzle.ts'
import { makeCreateLocation } from './app/create-location.usecase.ts'
import { makeUpdateLocation } from './app/update-location.usecase.ts'
import { makeDeleteLocation } from './app/delete-location.usecase.ts'
import { makeGetLocation } from './app/get-location.usecase.ts'
import { makeListLocation } from './app/list-location.usecase.ts'
import { createLocationRoute } from './http/location.route.ts'

export interface LocationUseCases {
  create: ReturnType<typeof makeCreateLocation>
  update: ReturnType<typeof makeUpdateLocation>
  remove: ReturnType<typeof makeDeleteLocation>
  get: ReturnType<typeof makeGetLocation>
  list: ReturnType<typeof makeListLocation>
}

export const locationModule: ModuleDescriptor = {
  name: 'location',
  layer: 0,
  dependsOn: [],
  create(ctx: ModuleContext) {
    const repo = new LocationRepoDrizzle(ctx.db)
    const base = { uow: ctx.uow, repo, audit: ctx.auditPort, cache: ctx.cache }
    const uc: LocationUseCases = {
      create: makeCreateLocation(base),
      update: makeUpdateLocation(base),
      remove: makeDeleteLocation(base),
      get: makeGetLocation({ repo, cache: ctx.cache }),
      list: makeListLocation({ repo }),
    }
    return { route: createLocationRoute(uc), api: { get: uc.get } }   // `api.get` = what other modules may call downward
  },
}
```

---

## What each file must and must not contain

| File | Must | Must NOT |
| --- | --- | --- |
| `contract/*.dto.ts` | Zod DTOs | any logic, DB, imports from app/infra |
| `domain/*.ts` | pure types, mapping, rules, errors | DB, Elysia, Zod, cache, `uow` |
| `app/ports.ts` | port interfaces | implementations |
| `app/*.usecase.ts` | orchestration; write use-cases open `uow` | direct Drizzle, Elysia, concrete adapters |
| `infra/*.repo.drizzle.ts` | Drizzle queries implementing the port; thread `cx` | business rules, Elysia |
| `http/*.route.ts` | validate → call one use-case → `res.*`; declare `permission` | business logic, domain/infra imports |
| `*.module.ts` | descriptor wiring | logic |

---

**Next:** [11-complex-module.md](./11-complex-module.md)
