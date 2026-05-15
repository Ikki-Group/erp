import { CacheService, type CacheClient } from '@/core/cache'
import type { WithPaginationResult } from '@/core/database/pagination'
import { NotFoundError } from '@/core/http/errors'

import type { ActorId, EntityRef } from '@/types/utils'

import { SalesTypeRepo } from './sales-type.repo'
import type {
	SalesTypeCreateSchema,
	SalesTypeSchema,
	SalesTypeFilterSchema,
	SalesTypeUpdateSchema,
} from './sales-type.schema'

export class SalesTypeService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: SalesTypeRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'sales-type', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<SalesTypeSchema> {
		const key = `byId:${id}`
		const type = await this.cache.getOrSetSkipUndefined({
			key,
			factory: () => this.repo.getById(id),
		})
		if (!type) throw new NotFoundError(`Sales type with ID ${id} not found`, 'SALES_TYPE_NOT_FOUND')
		return type
	}

	async find(): Promise<SalesTypeSchema[]> {
		const key = 'list'
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.getAll(),
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(filter: SalesTypeFilterSchema): Promise<WithPaginationResult<SalesTypeSchema>> {
		const key = `list.${JSON.stringify(filter)}`
		return this.cache.getOrSet({
			key,
			factory: () => this.repo.getListPaginated(filter),
		})
	}

	async handleDetail(id: number): Promise<SalesTypeSchema> {
		return this.getById(id)
	}

	async handleCreate(data: SalesTypeCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.create(data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count'] })
		return result
	}

	async handleUpdate(
		id: number,
		data: Partial<SalesTypeUpdateSchema>,
		actorId: ActorId,
	): Promise<EntityRef> {
		const result = await this.repo.update(id, data, actorId)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}

	async handleRemove(id: number): Promise<EntityRef> {
		const result = await this.repo.delete(id)
		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })
		return result
	}

	/* --------------------------------- INTERNAL -------------------------------- */

	async seed(data: (SalesTypeCreateSchema & { id?: number; createdBy: ActorId })[]): Promise<void> {
		await this.repo.seed(data)
		await this.cache.deleteMany({ keys: ['list', 'count'] })
	}
}
