import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField, type WithPaginationResult } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import { RelationMap } from '@/core/utils/relation-map'
import type { RecordId } from '@/core/validation'

import { locationsTable } from '@/db/schema'

import * as dto from './location-master.dto'
import { LocationMasterRepo } from './location-master.repo'

const uniqueFields: ConflictField<'name'>[] = [
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
	constructor(private readonly repo: LocationMasterRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getList(): Promise<dto.LocationDto[]> {
		return record('LocationMasterService.getList', async () => {
			return this.repo.getList()
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
			return this.repo.getById(id)
		})
	}

	async count(): Promise<number> {
		return record('LocationMasterService.count', async () => {
			return this.repo.count()
		})
	}

	async seed(data: (dto.LocationCreateDto & { createdBy: number })[]): Promise<void> {
		return record('LocationMasterService.seed', async () => {
			await this.repo.seed(data)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

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

			return { id }
		})
	}

	async handleRemove(id: number): Promise<RecordId> {
		return record('LocationMasterService.handleRemove', async () => {
			const result = await this.repo.remove(id)
			if (!result) throw err.notFound(id)
			return { id }
		})
	}
}
