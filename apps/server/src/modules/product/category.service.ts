import { CacheService, type CacheClient } from '@/core/cache'

import { NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/types/pagination'
import type { ActorId, EntityRef } from '@/types/utils'

import { ProductCategoryRepo } from './category.repo'
import type {
	ProductCategorySchema,
	ProductCategoryFilterSchema,
	ProductCategoryCreateSchema,
	ProductCategoryUpdateSchema,
} from './category.schema'

export class ProductCategoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ProductCategoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'product-category', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<ProductCategorySchema | undefined> {
		return this.cache.getOrSetSkipUndefined({
			key: `byId:${id}`,
			factory: () => this.repo.getById(id),
		})
	}

	async getAll(locationId?: number): Promise<ProductCategorySchema[]> {
		const cacheKey = locationId ? `list:location:${locationId}` : 'list'
		return this.cache.getOrSet({
			key: cacheKey,
			factory: () => this.repo.getAll(locationId),
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: ProductCategoryFilterSchema,
	): Promise<WithPaginationResult<ProductCategorySchema>> {
		return this.repo.getListPaginated(filter)
	}

	async handleDetail(id: number): Promise<ProductCategorySchema> {
		const result = await this.getById(id)
		if (!result)
			throw new NotFoundError(
				`Product category with ID ${id} not found`,
				'PRODUCT_CATEGORY_NOT_FOUND',
			)
		return result
	}

	async handleCreate(data: ProductCategoryCreateSchema, actorId: ActorId): Promise<EntityRef> {
		const result = await this.repo.create(data, actorId)

		await this.cache.deleteMany({ keys: ['list', `list:location:${data.locationId}`, 'count'] })

		return result
	}

	async handleUpdate(
		id: number,
		data: ProductCategoryUpdateSchema,
		actorId: ActorId,
	): Promise<EntityRef> {
		const existing = await this.getById(id)
		if (!existing)
			throw new NotFoundError(
				`Product category with ID ${id} not found`,
				'PRODUCT_CATEGORY_NOT_FOUND',
			)

		await this.repo.update(id, data, actorId)

		const cacheKeys = ['list', 'count', `byId:${id}`]
		if (data.locationId) {
			cacheKeys.push(`list:location:${data.locationId}`)
			cacheKeys.push(`list:location:${existing.locationId}`)
		}
		await this.cache.deleteMany({ keys: cacheKeys })

		return { id }
	}

	async handleRemove(id: number): Promise<EntityRef> {
		const result = await this.repo.softDelete(id)

		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

		return result
	}

	async handleHardRemove(id: number): Promise<EntityRef> {
		const result = await this.repo.hardDelete(id)

		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

		return result
	}
}
