import { record } from '@elysiajs/opentelemetry'

import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { CacheService, type CacheClient } from '@/lib/cache'

import type {
	SalesTypeCreateDto,
	SalesTypeDto,
	SalesTypeFilterDto,
	SalesTypeUpdateDto,
} from './sales-type.dto'
import { SalesTypeRepo } from './sales-type.repo'

export class SalesTypeService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: SalesTypeRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'sales-type', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SalesTypeDto> {
		return record('SalesTypeService.getById', async () => {
			const key = `byId:${id}`
			const type = await this.cache.getOrSetSkipUndefined({
				key,
				factory: () => this.repo.getById(id),
			})
			if (!type)
				throw new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')
			return type
		})
	}

	async find(): Promise<SalesTypeDto[]> {
		return record('SalesTypeService.find', async () => {
			const key = 'list'
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getAll(),
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: SalesTypeFilterDto): Promise<WithPaginationResult<SalesTypeDto>> {
		return record('SalesTypeService.handleList', async () => {
			const key = `list.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getListPaginated(filter),
			})
		})
	}

	async handleDetail(id: number): Promise<SalesTypeDto> {
		return record('SalesTypeService.handleDetail', async () => {
			return this.getById(id)
		})
	}

	async handleCreate(data: SalesTypeCreateDto, actorId: number): Promise<{ id: number }> {
		return record('SalesTypeService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
			return result
		})
	}

	async handleUpdate(
		id: number,
		data: Partial<SalesTypeUpdateDto>,
		actorId: number,
	): Promise<{ id: number }> {
		return record('SalesTypeService.handleUpdate', async () => {
			const result = await this.repo.update(id, data, actorId)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	async handleRemove(id: number): Promise<{ id: number }> {
		return record('SalesTypeService.handleRemove', async () => {
			const result = await this.repo.delete(id)
			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
			return result
		})
	}

	/* --------------------------------- INTERNAL -------------------------------- */

	async seed(data: (SalesTypeCreateDto & { id?: number; createdBy: number })[]): Promise<void> {
		return record('SalesTypeService.seed', async () => {
			await this.repo.seed(data)
			await this.cache.deleteMany({ keys: ['list', 'count'] })
		})
	}
}
