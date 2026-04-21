import { record } from '@elysiajs/opentelemetry'

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import { RelationMap } from '@/core/utils/relation-map'
import type { RecordId } from '@/core/validation'

import { locationsTable } from '@/db/schema'

import * as dto from '../dto'
import { LocationMasterRepo } from '../repo/location-master.repo'

const cache = bento.namespace('location-master')

const uniqueFields: ConflictField<'code' | 'name'>[] = [
	{
		field: 'code',
		column: locationsTable.code,
		message: 'Location code already exists',
		code: 'LOCATION_CODE_ALREADY_EXISTS',
	},
	{
		field: 'name',
		column: locationsTable.name,
		message: 'Location name already exists',
		code: 'LOCATION_NAME_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError(`Location with ID ${id} not found`, 'LOCATION_NOT_FOUND'),
	createFailed: () => new InternalServerError('Location creation failed', 'LOCATION_CREATE_FAILED'),
}

export class LocationMasterService {
	constructor(public repo = new LocationMasterRepo()) {}

	// Internal
	private async clearCache(id?: number): Promise<void> {
		const keys = [CACHE_KEY_DEFAULT.list, CACHE_KEY_DEFAULT.count]
		if (id) keys.push(CACHE_KEY_DEFAULT.byId(id))
		await cache.deleteMany({ keys })
	}

	// Public methods
	async getList(): Promise<dto.LocationDto[]> {
		return record('LocationMasterService.getList', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.list,
				factory: async () => this.repo.getList(),
			})
		})
	}

	async getRelationMap(): Promise<RelationMap<number, dto.LocationDto>> {
		return record('LocationMasterService.getRelationMap', async () => {
			const locations = await this.getList()
			return RelationMap.fromArray(locations, (l) => l.id)
		})
	}

	async getById(id: number): Promise<dto.LocationDto | undefined> {
		return record('LocationMasterService.getById', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.byId(id),
				factory: async ({ skip }) => {
					const result = await this.repo.getById(id)
					return result ?? skip()
				},
			})
		})
	}

	async count(): Promise<number> {
		return record('LocationMasterService.count', async () => {
			return cache.getOrSet({
				key: CACHE_KEY_DEFAULT.count,
				factory: async () => this.repo.count(),
			})
		})
	}

	// Handler layer
	async handleList(filter: dto.LocationFilterDto): Promise<WithPaginationResult<dto.LocationDto>> {
		return record('LocationMasterService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)
			return result
		})
	}

	async handleDetail(id: number): Promise<dto.LocationDto> {
		return record('LocationMasterService.handleDetail', async () => {
			const result = await this.repo.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: dto.LocationCreateDto, actorId: number): Promise<RecordId> {
		return record('LocationMasterService.handleCreate', async () => {
			await checkConflict({
				table: locationsTable,
				pkColumn: locationsTable.id,
				fields: uniqueFields,
				input: data,
			})
			const result = await this.repo.create(data, actorId)
			if (!result) throw err.createFailed()

			await this.clearCache()
			return { id: result }
		})
	}

	async handleUpdate(data: dto.LocationUpdateDto, actorId: number): Promise<RecordId> {
		return record('LocationMasterService.handleUpdate', async () => {
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

			const result = await this.repo.update(data, actorId)
			if (!result) throw err.notFound(id)

			await this.clearCache(id)
			return { id }
		})
	}

	async handleRemove(id: number, actorId: number): Promise<RecordId> {
		return record('LocationMasterService.handleRemove', async () => {
			const result = await this.repo.remove(id, actorId)
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return { id }
		})
	}

	async handleHardRemove(id: number): Promise<RecordId> {
		return record('LocationMasterService.handleHardRemove', async () => {
			const result = await this.repo.hardRemove(id)
			if (!result) throw err.notFound(id)
			await this.clearCache(id)
			return { id }
		})
	}
}
