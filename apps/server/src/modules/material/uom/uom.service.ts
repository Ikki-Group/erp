import { record } from '@elysiajs/opentelemetry'

import { checkConflict, type ConflictField } from '@/core/database'
import { InternalServerError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { uomsTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/lib/cache'

import type { UomDto, UomFilterDto, UomMutationDto } from './uom.dto'
import { UomRepo } from './uom.repo'

/* -------------------------------- CONSTANTS -------------------------------- */

const err = {
	notFound: (id: number) => new NotFoundError(`UOM with ID ${id} not found`, 'UOM_NOT_FOUND'),
	createFailed: () => new InternalServerError('UOM creation failed', 'UOM_CREATE_FAILED'),
}

const uniqueFields: ConflictField<'code'>[] = [
	{
		field: 'code',
		column: uomsTable.code,
		message: 'UOM code already exists',
		code: 'UOM_CODE_ALREADY_EXISTS',
	},
]

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class UomService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: UomRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'material.uom', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async find(): Promise<UomDto[]> {
		return record('UomService.find', async () => {
			return this.cache.getOrSet({
				key: 'list',
				factory: () => this.repo.getList(),
			})
		})
	}

	async getById(id: number): Promise<UomDto> {
		return record('UomService.getById', async () => {
			const result = await this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async count(): Promise<number> {
		return record('UomService.count', async () => {
			return this.cache.getOrSet({
				key: 'count',
				factory: () => this.repo.count(),
			})
		})
	}

	async seed(data: { code: string; createdBy: number }[]): Promise<void> {
		return record('UomService.seed', async () => {
			return this.repo.seed(data)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: UomFilterDto): Promise<WithPaginationResult<UomDto>> {
		return record('UomService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<UomDto> {
		return record('UomService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: UomMutationDto, actorId: number): Promise<{ id: number }> {
		return record('UomService.handleCreate', async () => {
			const code = data.code.toUpperCase().trim()

			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
				fields: uniqueFields,
				input: { code },
			})

			const result = await this.repo.create({ code, createdBy: actorId })
			if (!result) throw err.createFailed()

			await this.cache.deleteMany({ keys: ['list', 'count'] })

			return { id: result }
		})
	}

	async handleUpdate(
		id: number,
		data: Partial<UomMutationDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('UomService.handleUpdate', async () => {
			const existing = await this.getById(id)

			const code = data.code ? data.code.toUpperCase().trim() : existing.code

			await checkConflict({
				table: uomsTable,
				pkColumn: uomsTable.id,
				fields: uniqueFields,
				input: { code },
				existing,
			})

			const result = await this.repo.update(id, { code, updatedBy: actorId })
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id }
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('UomService.handleRemove', async () => {
			const existing = await this.getById(id)
			if (!existing) throw err.notFound(id)

			const result = await this.repo.remove(id, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id }
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('UomService.handleHardRemove', async () => {
			const result = await this.repo.hardRemove(id)
			if (!result) throw err.notFound(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return { id }
		})
	}
}
