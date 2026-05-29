import { record } from '@elysiajs/opentelemetry'

import { locationsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'
import { InternalServerError, NotFoundError } from '@/shared/errors/http-error'
import { RelationMap } from '@/shared/utils'

import type { WithPaginationResult } from '@/types/pagination'
import type { ActorId, EntityRef } from '@/types/utils'

import { LocationRepo } from './location.repo'
import type {
	LocationSchema,
	LocationMutationSchema,
	LocationFilterSchema,
} from './location.schema'

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
		private readonly repo: LocationRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'location')
	}

	async getListAll(): Promise<LocationSchema[]> {
		return record('LocationService.getListAll', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.getList(),
			}),
		)
	}

	async getRelationMap(): Promise<RelationMap<number, LocationSchema>> {
		return record('LocationService.getRelationMap', async () =>
			RelationMap.fromArray(await this.getListAll(), (v) => v.id),
		)
	}

	async getById(id: number): Promise<LocationSchema | undefined> {
		return record('LocationService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id),
			}),
		)
	}

	async create(data: LocationMutationSchema, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.create', async () => {
			await checkConflict({
				table: locationsTable,
				pkColumn: locationsTable.id,
				fields: uniqueFields,
				input: data,
			})

			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async update(
		id: number,
		data: LocationMutationSchema,
		actorId: ActorId,
	): Promise<{ id: number }> {
		return record('LocationService.update', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			await checkConflict({
				table: locationsTable,
				pkColumn: locationsTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			const result = await this.repo.update(id, data, actorId)
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

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: LocationFilterSchema): Promise<WithPaginationResult<LocationSchema>> {
		return record('LocationService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<LocationSchema> {
		return record('LocationService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: LocationMutationSchema, actorId: ActorId): Promise<EntityRef> {
		return record('LocationService.handleCreate', async () => {
			return this.create(data, actorId)
		})
	}

	async handleUpdate(
		id: number,
		data: LocationMutationSchema,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('LocationService.handleUpdate', async () => {
			return this.update(id, data, actorId)
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('LocationService.handleRemove', async () => {
			return this.remove(id)
		})
	}
}
