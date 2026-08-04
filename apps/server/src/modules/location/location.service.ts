import { record } from '@elysiajs/opentelemetry'

import { locationsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { assertFound, checkConflict, defineConflictFields, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type {
	LocationCreateSchema,
	LocationFilterSchema,
	LocationSchema,
	LocationUpdateSchema,
} from './location.contract'
import { LocationError } from './location.internal'
import type { ILocationRepo } from './location.repo'

const createConflictFields = defineConflictFields<LocationCreateSchema>()([
	{
		field: 'name',
		column: locationsTable.name,
		message: 'Location name already exists',
		code: 'LOCATION_NAME_ALREADY_EXISTS',
	},
	{
		field: 'code',
		column: locationsTable.code,
		message: 'Location code already exists',
		code: 'LOCATION_CODE_ALREADY_EXISTS',
	},
])

const updateConflictFields = defineConflictFields<LocationUpdateSchema>()([
	{
		field: 'name',
		column: locationsTable.name,
		message: 'Location name already exists',
		code: 'LOCATION_NAME_ALREADY_EXISTS',
	},
])

export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ILocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	toRelationMap(items: LocationSchema[]): RelationMap<number, LocationSchema> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	/* --------------------------------- READ ---------------------------------- */

	async getListAll(): Promise<LocationSchema[]> {
		return record('LocationService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany(),
			}),
		)
	}

	async count(): Promise<number> {
		return record('LocationService.count', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.count,
				factory: () => this.repo.count(),
			}),
		)
	}

	async getById(id: number): Promise<LocationSchema | undefined> {
		return record('LocationService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	/**
	 * Fetches a location and asserts it exists AND is active.
	 * Use this from other modules before referencing a location
	 * (e.g. creating assignments, stock transactions, sales).
	 *
	 * @throws {NotFoundError} if location does not exist
	 * @throws {BadRequestError} if location exists but isActive is false
	 */
	async assertActive(id: number): Promise<LocationSchema> {
		const location = assertFound(await this.getById(id), () => LocationError.notFound(id))
		if (!location.isActive) throw LocationError.inactive(id)
		return location
	}

	/* -------------------------------- MUTATE ---------------------------------- */

	async seed(
		items: Pick<LocationSchema, 'id' | 'code' | 'name' | 'isActive' | 'type' | 'createdBy'>[],
		db: DbContext,
	): Promise<void> {
		return this.repo.insertMany(
			items.map((x) => ({
				...x,
				...stampCreate(x.createdBy),
			})),
			db,
		)
	}

	async create(data: LocationCreateSchema, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: locationsTable,
			pkColumn: locationsTable.id,
			fields: createConflictFields,
			input: data,
		})

		const result = await this.repo.insert({
			...data,
			...stampCreate(actorId),
		})
		if (!result) throw LocationError.createFailed()

		await this.cache.invalidateStandard()
		return result
	}

	async update(data: LocationUpdateSchema, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = assertFound(await this.getById(id), () => LocationError.notFound(id))

		await checkConflict({
			db: this.repo.db,
			table: locationsTable,
			pkColumn: locationsTable.id,
			fields: updateConflictFields,
			input: data,
			existing,
		})

		const result = await this.repo.update(id, {
			...data,
			...stampUpdate(actorId),
		})
		if (!result) throw LocationError.notFound(id)

		await this.cache.invalidateStandard(id)
		return result
	}

	async remove(id: number): Promise<EntityRef> {
		assertFound(await this.getById(id), () => LocationError.notFound(id))

		const hasRefs = await this.repo.hasReferences(id)
		if (hasRefs) throw LocationError.hasReferences(id)

		const result = await this.repo.remove(id)
		if (!result) throw LocationError.notFound(id)

		await this.cache.invalidateStandard(id)
		return result
	}

	/* --------------------------------- HANDLE --------------------------------- */
	// `handleX` are the HTTP entrypoints (routes call ONLY these). They own the
	// telemetry span; the internal reuse methods above are called directly by
	// sibling services and are not re-wrapped here to avoid double spans.

	async handleList(filter: LocationFilterSchema): Promise<WithPaginationResult<LocationSchema>> {
		return record('LocationService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<LocationSchema> {
		return record('LocationService.handleGetById', async () =>
			assertFound(await this.getById(id), () => LocationError.notFound(id)),
		)
	}

	async handleCreate(data: LocationCreateSchema, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: LocationUpdateSchema, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('LocationService.handleDelete', async () => this.remove(id))
	}
}
