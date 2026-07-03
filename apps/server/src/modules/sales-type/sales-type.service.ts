import { record } from '@elysiajs/opentelemetry'

import { salesTypesTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/infra/cache'
import { checkConflict, type ConflictField } from '@/infra/database'
import { BadRequestError, InternalServerError, NotFoundError } from '@/shared/errors/http-error'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	SalesTypeCreateDto,
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeUpdateDto,
} from './sales-type.contract'
import type { SalesTypeRepo } from './sales-type.repo'

const uniqueFields: ConflictField<{ code: string }>[] = [
	{
		field: 'code',
		column: salesTypesTable.code,
		message: 'Sales type code already exists',
		code: 'SALES_TYPE_CODE_ALREADY_EXISTS',
	},
]

const err = {
	notFound: (id: number) =>
		new NotFoundError('Sales type not found', { code: 'SALES_TYPE_NOT_FOUND', context: { id } }),
	createFailed: () =>
		new InternalServerError('Sales type creation failed', { code: 'SALES_TYPE_CREATE_FAILED' }),
}

export class SalesTypeService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: SalesTypeRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'sales-type')
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SalesTypeDto | undefined> {
		return record('SalesTypeService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.getById(id),
			}),
		)
	}

	async find(): Promise<SalesTypeDto[]> {
		return record('SalesTypeService.find', async () =>
			this.cache.getOrSet({
				key: this.cache.keys.list,
				factory: () => this.repo.getAll(),
			}),
		)
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: SalesTypeFilterDto): Promise<WithPaginationResult<SalesTypeDto>> {
		return record('SalesTypeService.handleList', async () => this.repo.getListPaginated(filter))
	}

	async handleDetail(id: number): Promise<SalesTypeDto> {
		return record('SalesTypeService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw err.notFound(id)
			return result
		})
	}

	async handleCreate(data: SalesTypeCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('SalesTypeService.handleCreate', async () => {
			const code = data.code.trim().toLowerCase()
			const name = data.name.trim()
			const input = { ...data, code, name }

			await checkConflict({
				db: this.repo.db,
				table: salesTypesTable,
				pkColumn: salesTypesTable.id,
				fields: uniqueFields,
				input,
			})

			const result = await this.repo.create(input, actorId)
			if (!result) throw err.createFailed()

			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
			return result
		})
	}

	async handleUpdate(
		id: number,
		data: Partial<SalesTypeUpdateDto>,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('SalesTypeService.handleUpdate', async () => {
			const existing = await this.handleDetail(id)
			if (existing.isSystem) {
				throw new BadRequestError('Cannot mutate a system sales type', {
					code: 'SALES_TYPE_IS_SYSTEM',
				})
			}

			const code = data.code ? data.code.trim().toLowerCase() : existing.code
			const name = data.name ? data.name.trim() : existing.name
			const input = { ...data, code, name }

			await checkConflict({
				db: this.repo.db,
				table: salesTypesTable,
				pkColumn: salesTypesTable.id,
				fields: uniqueFields,
				input,
				existing,
			})

			const result = await this.repo.update(id, input, actorId)
			if (!result) throw err.notFound(id)

			await this.cache.deleteFromKeys([
				this.cache.keys.list,
				this.cache.keys.count,
				this.cache.keys.byId(id),
			])
			return result
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('SalesTypeService.handleRemove', async () => {
			const existing = await this.handleDetail(id)
			if (existing.isSystem) {
				throw new BadRequestError('Cannot mutate a system sales type', {
					code: 'SALES_TYPE_IS_SYSTEM',
				})
			}

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

	/* --------------------------------- INTERNAL -------------------------------- */

	async seed(data: (SalesTypeCreateDto & { id?: number; createdBy: ActorId })[]): Promise<void> {
		return record('SalesTypeService.seed', async () => {
			const mappedData = data.map((d) => ({
				...d,
				code: d.code.trim().toLowerCase(),
				name: d.name.trim(),
			}))
			await this.repo.seed(mappedData)
			await this.cache.deleteFromKeys([this.cache.keys.list, this.cache.keys.count])
		})
	}
}
