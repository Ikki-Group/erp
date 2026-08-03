import { record } from '@elysiajs/opentelemetry'

import { locationsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { assertFound, checkConflict, defineConflictFields, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'
import { RelationMap } from '@/shared/utils'

import type {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from './location.contract'
import { LocationError } from './location.internal'
import type { ILocationRepo } from './location.repo'

const uniqueFields = defineConflictFields<LocationCreateDto>()([
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

export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ILocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	toRelationMap(items: LocationDto[]): RelationMap<number, LocationDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	/* --------------------------------- READ ---------------------------------- */

	async getListAll(): Promise<LocationDto[]> {
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

	async getById(id: number): Promise<LocationDto | undefined> {
		return record('LocationService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	/* -------------------------------- MUTATE ---------------------------------- */

	async seed(
		items: Pick<LocationDto, 'id' | 'code' | 'name' | 'isActive' | 'type' | 'createdBy'>[],
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

	async create(data: LocationCreateDto, actorId: ActorId): Promise<EntityRef> {
		await checkConflict({
			db: this.repo.db,
			table: locationsTable,
			pkColumn: locationsTable.id,
			fields: uniqueFields,
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

	async update(data: LocationUpdateDto, actorId: ActorId): Promise<EntityRef> {
		const { id } = data
		const existing = assertFound(await this.getById(id), () => LocationError.notFound(id))

		await checkConflict({
			db: this.repo.db,
			table: locationsTable,
			pkColumn: locationsTable.id,
			fields: uniqueFields,
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
		const result = await this.repo.remove(id)
		if (!result) throw LocationError.notFound(id)

		await this.cache.invalidateStandard(id)
		return result
	}

	/* --------------------------------- HANDLE --------------------------------- */
	// `handleX` are the HTTP entrypoints (routes call ONLY these). They own the
	// telemetry span; the internal reuse methods above are called directly by
	// sibling services and are not re-wrapped here to avoid double spans.

	async handleList(filter: LocationFilterDto): Promise<WithPaginationResult<LocationDto>> {
		return record('LocationService.handleList', async () => this.repo.findPage(filter))
	}

	async handleGetById(id: number): Promise<LocationDto> {
		return record('LocationService.handleGetById', async () =>
			assertFound(await this.getById(id), () => LocationError.notFound(id)),
		)
	}

	async handleCreate(data: LocationCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: LocationUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleDelete(id: number): Promise<EntityRef> {
		return record('LocationService.handleDelete', async () => this.remove(id))
	}
}
