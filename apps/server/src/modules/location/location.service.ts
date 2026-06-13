import { record } from '@elysiajs/opentelemetry'

import { locationsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'
import { RelationMap } from '@/shared/utils'

import type { WithPaginationResult } from '@/types/pagination'
import type { ActorId, EntityRef } from '@/types/utils'

import type {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from '@/modules/location/location.contract'
import type { LocationRepo } from '@/modules/location/location.repo'

const uniqueFields: ConflictField<{ name: string; code: string }>[] = [
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
]

const err = {
	notFound: (id: number) =>
		new NotFoundError('Location not found', { code: 'LOCATION_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Location creation failed', { code: 'LOCATION_CREATE_FAILED' }),
}

export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly db: DbContext,
		private readonly repo: LocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	async getListAll(): Promise<LocationDto[]> {
		return record('LocationService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany({}),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, LocationDto>> {
		return record('LocationService.getRelationMap', async () =>
			RelationMap.fromArray(await this.getListAll(), (v) => v.id),
		)
	}

	async getPage(filter: LocationFilterDto): Promise<WithPaginationResult<LocationDto>> {
		return record('LocationService.getPage', async () => this.repo.findPage(filter))
	}

	async getById(id: number): Promise<LocationDto | undefined> {
		return record('LocationService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async create(data: LocationCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.create', async () => {
			await checkConflict({
				table: locationsTable,
				pkColumn: locationsTable.id,
				fields: uniqueFields,
				input: data,
			})

			const result = await this.repo.insert({
				...data,
				...stampCreate(actorId),
			})
			if (!result) throw err.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async update(data: LocationUpdateDto, actorId: ActorId): Promise<{ id: number }> {
		return record('LocationService.update', async () => {
			const { id } = data
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
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
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}

	async remove(id: number): Promise<EntityRef> {
		return record('LocationService.remove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}
}
