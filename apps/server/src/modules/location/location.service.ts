import { record } from '@elysiajs/opentelemetry'

import { locationsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField, type DbContext } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import { RelationMap } from '@/shared/utils'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	LocationCreateDto,
	LocationDto,
	LocationFilterDto,
	LocationUpdateDto,
} from './location.contract'
import { LocationError } from './location.internal'
import type { LocationRepo } from './location.repo'

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

export class LocationService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: LocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	toRelationMap(items: LocationDto[]): RelationMap<number, LocationDto> {
		return RelationMap.fromArray(items, (v) => v.id)
	}

	async getListAll(): Promise<LocationDto[]> {
		return record('LocationService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.findMany({}),
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
			if (!result) throw LocationError.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async update(data: LocationUpdateDto, actorId: ActorId): Promise<{ id: number }> {
		return record('LocationService.update', async () => {
			const { id } = data
			const existing = await this.getById(id)
			if (!existing) throw LocationError.notFound(id)

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
			if (!result) throw LocationError.notFound(id)

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
			if (!result) throw LocationError.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])

			return result
		})
	}

	/* --------------------------------- HANDLE --------------------------------- */

	async handleList(filter: LocationFilterDto): Promise<WithPaginationResult<LocationDto>> {
		return record('LocationService.handleList', async () => this.repo.findPage(filter))
	}

	async handleDetail(id: number): Promise<LocationDto> {
		return record('LocationService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw LocationError.notFound(id)
			return result
		})
	}

	async handleCreate(data: LocationCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleCreate', async () => this.create(data, actorId))
	}

	async handleUpdate(data: LocationUpdateDto, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleUpdate', async () => this.update(data, actorId))
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('LocationService.handleRemove', async () => this.remove(id))
	}
}
