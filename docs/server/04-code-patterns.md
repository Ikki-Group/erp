# Code Patterns

Copy-ready patterns for the Ikki ERP server — complements [02-module-standard.md](./02-module-standard.md) and [03-code-standard.md](./03-code-standard.md).

## Zod / Schema

```ts
import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

// Entity schema (output) — use zp.* (no coercion)
export const LocationSchema = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: LocationTypeEnum,
	description: zp.str.nullable(),
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type LocationSchema = z.infer<typeof LocationSchema>

// Filter schema (query) — use zq.* (coerced)
export const LocationFilterSchema = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: LocationTypeEnum.optional(),
})
export type LocationFilterSchema = z.infer<typeof LocationFilterSchema>

// Reusable mutation shape (private) — use zc.* (trimmed/validated)
const LocationMutationSchema = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	description: zc.strTrimNullable,
	isActive: zp.bool.default(true),
})

// Create schema
export const LocationCreateSchema = LocationMutationSchema
export type LocationCreateSchema = z.infer<typeof LocationCreateSchema>

// Update schema — id inline, spread-shape (never .extend())
export const LocationUpdateSchema = z.object({ id: zp.id, ...LocationMutationSchema.shape })
export type LocationUpdateSchema = z.infer<typeof LocationUpdateSchema>
```

## Repository

Declare a port; class implements it. Reads return `undefined`; writes return `EntityRef | undefined`.

```ts
export interface ILocationRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<LocationSchema | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<LocationSchema[]>
	findPage(filter: LocationFilterSchema, db?: DbContext): Promise<WithPaginationResult<LocationSchema>>
	insert(data: LocationInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
	remove(id: number, db?: DbContext): Promise<EntityRef | undefined>
}

export class LocationRepo implements ILocationRepo {
	constructor(readonly db: DbContext) {}

	async findById(id: number, db: DbContext = this.db) {
		return db
			.select()
			.from(locationsTable)
			.where(eq(locationsTable.id, id))
			.limit(1)
			.then(takeFirst)
	}

	async findByIds(ids: number[], db: DbContext = this.db) {
		if (ids.length === 0) return []
		return db.select().from(locationsTable).where(inArray(locationsTable.id, ids))
	}

	async insert(data: LocationInsert, db: DbContext = this.db) {
		const [res] = await db
			.insert(locationsTable)
			.values({ ...data })
			.returning({ id: locationsTable.id })
		return res
	}
}
```

### Pagination (paginateWindow)

```ts
async findPage(filter: LocationFilterSchema, db: DbContext = this.db) {
  const where = this.#buildWhere(filter)
  const { limit, offset } = toLimitOffset(filter)

  const rows = await db
    .select({ ...getColumns(locationsTable), rowCount: sql<number>`count(*) over()` })
    .from(locationsTable).where(where)
    .orderBy(sortBy(locationsTable.updatedAt, 'desc'))
    .limit(limit).offset(offset)

  return paginateWindow(rows, filter)
}
```

## Service

Depend on the port. `handleX` = route entrypoints. `record(...)` wraps telemetry at ONE level.

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

	async handleCreate(data: LocationCreateSchema, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleCreate', async () => this.create(data, actorId))
	}

	async create(data: LocationCreateSchema, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({ db: this.repo.db, table, pkColumn, fields: uniqueFields, input: data })
		const result = await this.repo.insert({ ...data, ...stampCreate(actorId) })
		if (!result) throw LocationError.createFailed()
		await this.invalidate()
		return result
	}
}
```

## Conflict checking

```ts
const uniqueFields: ConflictField<{ name: string; code: string }>[] = [
	{ field: 'name', column: locationsTable.name, message: 'Name exists', code: 'NAME_EXISTS' },
	{ field: 'code', column: locationsTable.code, message: 'Code exists', code: 'CODE_EXISTS' },
]

// Create (no existing)
await checkConflict({ db: this.repo.db, table, pkColumn, fields: uniqueFields, input: data })

// Update (pass existing to skip unchanged + exclude current row)
await checkConflict({
	db: this.repo.db,
	table,
	pkColumn,
	fields: uniqueFields,
	input: data,
	existing,
})
```

## Transactions

```ts
const result = await withTransaction(this.repo.db, async (tx) => {
	const created = await this.repo.insert({ ...data, ...stampCreate(actorId) }, tx)
	if (!created) throw XError.createFailed()
	await this.deps.child.replaceByParentId(created.id, items, actorId, tx)
	return created
})
await this.invalidate()
return result
```

## Caching

```ts
// Read-through
await this.cache.getOrSet({ key: this.cache.keys.list, factory: () => this.repo.findMany() })

// Read-through, skip undefined
await this.cache.getOrSetWithSkip({
	key: this.cache.keys.byId(id),
	factory: () => this.repo.findById(id),
})

// Invalidate (called by every mutation)
await this.cache.deleteFromKeys([
	this.cache.keys.list,
	this.cache.keys.count,
	this.cache.keys.byId(id),
])
```

## Errors

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

## RelationMap (avoid N+1)

```ts
const locationIds = users.map((u) => u.locationId).filter(Boolean)
const locations = await locationRepo.findByIds(locationIds)
const locationMap = RelationMap.fromArray(locations, (v) => v.id)

const result = users.map((user) => ({
	...user,
	location: user.locationId ? locationMap.get(user.locationId) : null,
}))
```

## Routes

```ts
export function createLocationRoute(m: LocationModule) {
	return new Elysia({ prefix: '/location' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query }) => {
				const result = await m.handleList(query)
				return res.paginated(result)
			},
			{
				query: LocationFilterSchema,
				response: createPaginatedResponseDto(LocationSchema),
				auth: true,
			},
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await m.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{
				body: LocationCreateSchema,
				response: createSuccessResponseDto(zc.RecordId),
				auth: true,
			},
		)
}
```

---

**Next:** [05-module-checklist.md](./05-module-checklist.md) — Step-by-step build guide.
