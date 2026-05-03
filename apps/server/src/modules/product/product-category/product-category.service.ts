import { record } from '@elysiajs/opentelemetry'

import { checkConflict } from '@/core/database'
import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import { productCategoriesTable } from '@/db/schema'

import { CacheService, type CacheClient } from '@/lib/cache'

import {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
} from './product-category.dto'
import { ProductCategoryRepo } from './product-category.repo'

const uniqueFields = [
	{
		field: 'name' as const,
		column: productCategoriesTable.name,
		message: 'Product category name already exists',
		code: 'PRODUCT_CATEGORY_NAME_ALREADY_EXISTS',
	},
]

export class ProductCategoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ProductCategoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'product-category', client: cacheClient })
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<ProductCategoryDto> {
		return record('ProductCategoryService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
			})
		})
	}

	async getAll(): Promise<ProductCategoryDto[]> {
		return record('ProductCategoryService.getAll', async () => {
			return this.cache.getOrSet({
				key: 'list',
				factory: () => this.repo.getAll(),
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
			return this.getById(id)
		})
	}

	async handleCreate(data: ProductCategoryCreateDto, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleCreate', async () => {
			await checkConflict({
				table: productCategoriesTable,
				pkColumn: productCategoriesTable.id,
				fields: uniqueFields,
				input: data,
			})

			const result = await this.repo.create(data, actorId)

			await this.cache.deleteMany({ keys: ['list', 'count'] })

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

			await checkConflict({
				table: productCategoriesTable,
				pkColumn: productCategoriesTable.id,
				fields: uniqueFields,
				input: data,
				existing,
			})

			await this.repo.update(id, data, actorId)

			await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

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
