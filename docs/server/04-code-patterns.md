# Code Patterns

Copy-ready patterns for the Ikki ERP server.

## Contract (Zod)

```ts
import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

export const LocationTypeEnum = z.enum(['store', 'warehouse'])

const LocationMutationDto = z.object({
	code: zc.strTrim,
	name: zc.strTrim.min(3).max(100),
	type: LocationTypeEnum,
	isActive: zp.bool.default(true),
})

export const LocationDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: LocationTypeEnum,
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type LocationDto = z.infer<typeof LocationDto>

export const LocationFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: LocationTypeEnum.optional(),
})
export type LocationFilterDto = z.infer<typeof LocationFilterDto>

export const LocationCreateDto = LocationMutationDto
export type LocationCreateDto = z.infer<typeof LocationCreateDto>

export const LocationUpdateDto = z.object({ id: zp.id, ...LocationMutationDto.shape })
export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>
```

## Repository

```ts
export interface ILocationRepo {
	readonly db: DbContext
	findById(id: number, db?: DbContext): Promise<LocationDto | undefined>
	findByIds(ids: number[], db?: DbContext): Promise<LocationDto[]>
	findPage(filter: LocationFilterDto, db?: DbContext): Promise<WithPaginationResult<LocationDto>>
	insert(data: LocationInsert, db?: DbContext): Promise<EntityRef | undefined>
	update(id: number, data: LocationUpdate, db?: DbContext): Promise<EntityRef | undefined>
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

	async insert(data: LocationInsert, db: DbContext = this.db) {
		const [res] = await db
			.insert(locationsTable)
			.values({ ...data })
			.returning({ id: locationsTable.id })
		return res
	}
}
```

## Service

```ts
export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ILocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	async getById(id: number): Promise<LocationDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.findById(id),
		})
	}

	async handleGetById(id: number): Promise<LocationDto> {
		return assertFound(await this.getById(id), () => LocationError.notFound(id))
	}

	async handleCreate(data: LocationCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({ db: this.repo.db, table, pkColumn, fields: uniqueFields, input: data })
		const result = await this.repo.insert({ ...data, ...stampCreate(actorId) })
		if (!result) throw LocationError.createFailed()
		await this.cache.invalidateStandard()
		return result
	}
}
```

## Errors

```ts
// location.internal.ts
export const LocationError = {
	notFound: (id: number) =>
		new NotFoundError('Location not found', { code: 'LOCATION_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Location creation failed', { code: 'LOCATION_CREATE_FAILED' }),
}
```

## Conflict Checking

```ts
const uniqueFields = defineConflictFields<LocationCreateDto>()([
	{
		field: 'code',
		column: locationsTable.code,
		message: 'Code exists',
		code: 'LOCATION_CODE_EXISTS',
	},
	{
		field: 'name',
		column: locationsTable.name,
		message: 'Name exists',
		code: 'LOCATION_NAME_EXISTS',
	},
])
```

## Transactions

```ts
const result = await withTransaction(this.repo.db, async (tx) => {
	const created = await this.repo.insert({ ...data, ...stampCreate(actorId) }, tx)
	if (!created) throw XError.createFailed()
	await this.deps.child.replaceByParentId(created.id, items, actorId, tx)
	return created
})
await this.cache.invalidateStandard()
return result
```

## Routes

```ts
export function createLocationRoute(svc: LocationService) {
	return new Elysia({ prefix: '/location' })
		.use(authPluginMacro)
		.get(
			'/list',
			async ({ query, auth }) => {
				const result = await svc.handleList(query)
				return res.paginated(result)
			},
			{ query: LocationFilterDto, auth: true },
		)
		.post(
			'/create',
			async ({ body, auth }) => {
				const result = await svc.handleCreate(body, auth.userId)
				return res.created(result)
			},
			{ body: LocationCreateDto, auth: true },
		)
}
```

---

**Next:** [05-module-checklist.md](./05-module-checklist.md) — Build guide.
