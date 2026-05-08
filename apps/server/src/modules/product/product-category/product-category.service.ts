import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/core/cache'
import type { WithPaginationResult } from '@/core/database/pagination'
import { NotFoundError } from '@/core/http/errors'

import { productCategoriesTable } from '@/db/schema'

import {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
} from './product-category.dto'
import { ProductCategoryRepo } from './product-category.repo'

export class ProductCategoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ProductCategoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'product-category', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<ProductCategoryDto | undefined> {
		return record('ProductCategoryService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
		})
	}

	async getAll(locationId?: number): Promise<ProductCategoryDto[]> {
		return record('ProductCategoryService.getAll', async () => {
			const cacheKey = locationId ? `list:location:${locationId}` : 'list'
			return this.cache.getOrSet({
				key: cacheKey,
				factory: () => this.repo.getAll(locationId),
			})
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: ProductCategoryFilterDto,
	): Promise<WithPaginationResult<ProductCategoryDto>> {
		return record('ProductCategoryService.handleList', async () => {
			return this.repo.getListPaginated(filter)
		})
	}

	async handleDetail(id: number): Promise<ProductCategoryDto> {
		return record('ProductCategoryService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result)
				throw new NotFoundError(
					`Product category with ID ${id} not found`,
					'PRODUCT_CATEGORY_NOT_FOUND',
				)
			return result
		})
	}

	async handleCreate(data: ProductCategoryCreateDto, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleCreate', async () => {
			const result = await this.repo.create(data, actorId)

			await this.cache.deleteMany({ keys: ['list', `list:location:${data.locationId}`, 'count'] })

			return result
		})
	}

	async handleUpdate(
		id: number,
		data: ProductCategoryUpdateDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('ProductCategoryService.handleUpdate', async () => {
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
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleRemove', async () => {
			const result = await this.repo.softDelete(id, actorId)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return result
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleHardRemove', async () => {
			const result = await this.repo.hardDelete(id)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

			return result
		})
	}
}
