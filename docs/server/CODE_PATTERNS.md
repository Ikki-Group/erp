# Code Patterns & Best Practices

**Version**: 2.0
**Last Updated**: 2026-07-05

Concrete, copy-ready patterns for the Ikki ERP server. This complements — does
not repeat — the rules in **[MODULE_STANDARD.md](./MODULE_STANDARD.md)** (the
source of truth) and the layering in
**[SERVER_ARCHITECTURE.md](./SERVER_ARCHITECTURE.md)**. Reference modules:
`location/` (simple), `iam/` (complex).

---

## Table of Contents

1. [Zod / Contract](#zod--contract)
2. [Repository](#repository)
3. [Service](#service)
4. [Conflict Checking](#conflict-checking)
5. [Transactions](#transactions)
6. [Caching](#caching)
7. [Audit Stamps](#audit-stamps)
8. [Errors](#errors)
9. [RelationMap (in-memory JOIN)](#relationmap-in-memory-join)
10. [Routes](#routes)

---

## Zod / Contract

Output DTOs use `zp.*` (raw), mutation DTOs use `zc.*` (trimmed/validated), query
params use `zq.*` (coerced). See [MODULE_STANDARD.md § 7](./MODULE_STANDARD.md).

```ts
import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

// Output
export const RoleDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	permissions: z.array(zp.str),
	...zc.AuditBasic.shape,
})
export type RoleDto = z.infer<typeof RoleDto>

// Filter (query)
export const RoleFilterDto = z.object({ ...zq.pagination.shape, q: zq.search })
export type RoleFilterDto = z.infer<typeof RoleFilterDto>

// Reusable mutation shape
const RoleMutationDto = z.object({
	code: zc.strTrim.min(2).max(32).toUpperCase(),
	name: zc.strTrim.min(2),
	permissions: z.array(zp.str).default([]),
})

export const RoleCreateDto = RoleMutationDto
export type RoleCreateDto = z.infer<typeof RoleCreateDto>

// Update — id inline, spread-shape (never .extend())
export const RoleUpdateDto = z.object({ id: zp.id, ...RoleMutationDto.shape })
export type RoleUpdateDto = z.infer<typeof RoleUpdateDto>
```

---

## Repository

Declare a **port** (`I{Module}Repo`); the class implements it. Reads return
`T | undefined`; writes return `EntityRef | undefined`. Every write takes an
optional `db?: DbContext = this.db`.

```ts
export interface ILocationRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<LocationDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<LocationDto[]>
	findPage(filter: LocationFilterDto, db?: DbContext): Promise<WithPaginationResult<LocationDto>>
	insert(data: LocationInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class LocationRepo implements ILocationRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db) {
		return db.select().from(locationsTable).where(eq(locationsTable.id, id)).limit(1).then(takeFirst)
	}

	async findByIds(ids: number[], db: DbContext = this.db) {
		if (ids.length === 0) return [] // guard N+1 / empty IN ()
		return db.select().from(locationsTable).where(inArray(locationsTable.id, ids))
	}

	async insert(data: LocationInsert, db: DbContext = this.db) {
		const [res] = await db.insert(locationsTable).values(data).returning({ id: locationsTable.id })
		return res
	}
}
```

### Pagination (`paginate` helper)

```ts
async findPage(filter: LocationFilterDto, db: DbContext = this.db) {
	const where = this.#buildWhere(filter)
	return paginate<LocationDto>({
		data: ({ limit, offset }) =>
			db.select().from(locationsTable).where(where)
				.orderBy(sortBy(locationsTable.updatedAt, 'desc')).limit(limit).offset(offset),
		pq: filter,
		countQuery: () => db.select({ count: count() }).from(locationsTable).where(where),
	})
}
```

---

## Service

Depend on the **port**. `handleX` = the only route entrypoints. Wrap the OTEL
span with `record('...', async () => …)` at ONE level. Repos return `undefined`;
the service translates it to a typed error.

```ts
export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ILocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	private async invalidate(id?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		await this.cache.deleteFromKeys(keys)
	}

	async handleUpdate(data: LocationUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleUpdate', async () => {
			const existing = await this.getById(data.id)
			if (!existing) throw LocationError.notFound(data.id)

			await checkConflict({
				db: this.repo.db,
				table: locationsTable,
				pkColumn: locationsTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(data.id, { ...data, ...stampUpdate(actorId) })
			if (!result) throw LocationError.notFound(data.id)

			await this.invalidate(data.id)
			return result
		})
	}
}
```

> `@record(...)` **decorator** is NOT used — always the function form
> `record('span', async () => …)`.

---

## Conflict Checking

`checkConflict` takes a single **options object** with an explicit `db` (no
global fallback — keeps the uniqueness read inside the caller's transaction).

```ts
const uniqueFields: ConflictField<{ name: string; code: string }>[] = [
	{ field: 'name', column: locationsTable.name, message: 'Location name already exists', code: 'LOCATION_NAME_ALREADY_EXISTS' },
	{ field: 'code', column: locationsTable.code, message: 'Location code already exists', code: 'LOCATION_CODE_ALREADY_EXISTS' },
]

// create: no `existing`
await checkConflict({ db: this.repo.db, table: locationsTable, pkColumn: locationsTable.id, fields: uniqueFields, input: data })

// update: pass `existing` to skip unchanged fields + exclude the current row
await checkConflict({ db: this.repo.db, table: locationsTable, pkColumn: locationsTable.id, fields: uniqueFields, input: data, existing })
```

---

## Transactions

Multi-write operations must be atomic. Thread `tx` into every repo write.

```ts
const result = await withTransaction(this.repo.db, async (tx) => {
	const created = await this.repo.insert({ ...data, ...stampCreate(actorId) }, tx)
	if (!created) throw XError.createFailed()
	await this.deps.child.replaceByParentId(created.id, items, actorId, tx) // same tx
	return created
})
await this.invalidate()
return result
```

---

## Caching

`CacheService` is namespaced via `createWithDefaultKeys(client, ns)`. `getOrSet`
takes an **options object** `{ key, factory }` (not positional args).

```ts
// read-through
await this.cache.getOrSet({ key: this.cache.keys.list, factory: () => this.repo.findMany() })

// read-through, but don't cache empty/undefined
await this.cache.getOrSetWithSkip({ key: this.cache.keys.byId(id), factory: () => this.repo.findById(id) })

// invalidate (private helper called by every mutation)
await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count, this.cache.keys.byId(id)])
```

---

## Audit Stamps

Every mutation stamps the actor.

```ts
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

await this.repo.insert({ ...data, ...stampCreate(actorId) }) // createdBy/updatedBy/createdAt/updatedAt
await this.repo.update(id, { ...data, ...stampUpdate(actorId) }) // updatedBy/updatedAt
```

---

## Errors

Centralize typed errors in `{module}.internal.ts`; only include errors actually
thrown (no dead factories). Repos never throw — the service maps `undefined` to
the right error.

```ts
// location.internal.ts
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'

export const LocationError = {
	notFound: (id: number) =>
		new NotFoundError('Location not found', { code: 'LOCATION_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Location creation failed', { code: 'LOCATION_CREATE_FAILED' }),
}
```

---

## RelationMap (in-memory JOIN)

Avoid N+1: batch-fetch related rows, then join in memory. `RelationMap` extends
`Map`.

```ts
const users = await userRepo.findMany()
const locationIds = users.map((u) => u.defaultLocationId).filter(Boolean)
const locations = await locationRepo.findByIds(locationIds)
const locationMap = RelationMap.fromArray(locations, (v) => v.id)

const result = users.map((user) => ({
	...user,
	location: user.defaultLocationId ? locationMap.get(user.defaultLocationId) : null,
}))
```

---

## Routes

Thin Elysia routes: validate → one `handleX` → wrap in `res.*`. Full example and
rules in [SERVER_ARCHITECTURE.md § Routes](./SERVER_ARCHITECTURE.md) and
[MODULE_STANDARD.md § 2](./MODULE_STANDARD.md).

```ts
export function createLocationRoute(m: LocationModule) {
	return new Elysia({ prefix: '/location' })
		.use(authPluginMacro)
		.get('/list', async ({ query }) => res.paginated(await m.handleList(query)), {
			query: LocationFilterDto,
			response: createPaginatedResponseDto(LocationDto),
			auth: true,
		})
		.get('/detail', async ({ query }) => res.ok(await m.handleGetById(query.id)), {
			query: zq.recordId, // coerced {id}
			response: createSuccessResponseDto(LocationDto),
			auth: true,
		})
		.post('/create', async ({ body, auth }) => res.created(await m.handleCreate(body, auth.userId)), {
			body: LocationCreateDto,
			response: createSuccessResponseDto(zc.RecordId),
			auth: true,
		})
}
```
