import { record } from '@elysiajs/opentelemetry'

import { and, eq, not } from 'drizzle-orm'

import { productCategoriesTable } from '@/db/schema/product'

import { CacheService, type CacheClient } from '@/infra/cache'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'
import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
} from './category.contract'
import { CategoryError } from './category.internal'
import type { IProductCategoryRepo } from './category.repo'

export class ProductCategoryService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IProductCategoryRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'product-category')
	}

	private async invalidate(id?: number, locationId?: number): Promise<void> {
		const keys = [this.cache.keys.list, this.cache.keys.count]
		if (id !== undefined) keys.push(this.cache.keys.byId(id))
		if (locationId !== undefined) keys.push(`list:location:${locationId}`)
		await this.cache.deleteFromKeys(keys)
	}

	async getById(id: number): Promise<ProductCategoryDto | undefined> {
		return record('ProductCategoryService.getById', async () =>
			this.cache.getOrSetWithSkip({
				key: this.cache.keys.byId(id),
				factory: () => this.repo.findById(id),
			}),
		)
	}

	async getAll(locationId?: number): Promise<ProductCategoryDto[]> {
		const cacheKey = locationId ? `list:location:${locationId}` : this.cache.keys.list
		return record('ProductCategoryService.getAll', async () =>
			this.cache.getOrSet({
				key: cacheKey,
				factory: () => this.repo.findMany(locationId),
			}),
		)
	}

	async handleList(
		filter: ProductCategoryFilterDto,
	): Promise<WithPaginationResult<ProductCategoryDto>> {
		return record('ProductCategoryService.handleList', async () =>
			this.repo.findPage(filter),
		)
	}

	async handleDetail(id: number): Promise<ProductCategoryDto> {
		return record('ProductCategoryService.handleDetail', async () => {
			const result = await this.getById(id)
			if (!result) throw CategoryError.notFound(id)
			return result
		})
	}

	async handleCreate(data: ProductCategoryCreateDto, actorId: ActorId): Promise<EntityRef> {
		return record('ProductCategoryService.handleCreate', async () => {
			const name = data.name.trim()
			const code = data.code.trim()
			const locationId = data.locationId

			const existingInLocation = await this.repo.db
				.select()
				.from(productCategoriesTable)
				.where(
					and(
						eq(productCategoriesTable.locationId, locationId),
						eq(productCategoriesTable.name, name),
					),
				)
				.limit(1)

			if (existingInLocation.length > 0) {
				throw CategoryError.nameConflict(locationId)
			}

			const result = await this.repo.insert({
				code,
				name,
				description: data.description,
				locationId,
				...stampCreate(actorId),
			})
			if (!result) throw CategoryError.createFailed()

			await this.invalidate(undefined, locationId)
			return result
		})
	}

	async handleUpdate(
		id: number,
		data: ProductCategoryUpdateDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		return record('ProductCategoryService.handleUpdate', async () => {
			const existing = await this.repo.findById(id)
			if (!existing) throw CategoryError.notFound(id)

			const name = data.name.trim()
			const code = data.code.trim()
			const locationId = data.locationId

			const conflictInLocation = await this.repo.db
				.select()
				.from(productCategoriesTable)
				.where(
					and(
						eq(productCategoriesTable.locationId, locationId),
						eq(productCategoriesTable.name, name),
						not(eq(productCategoriesTable.id, id)),
					),
				)
				.limit(1)

			if (conflictInLocation.length > 0) {
				throw CategoryError.nameConflict(locationId)
			}

			const result = await this.repo.update(id, {
				code,
				name,
				description: data.description,
				locationId,
				...stampUpdate(actorId),
			})
			if (!result) throw CategoryError.notFound(id)

			await this.invalidate(id, locationId)
			await this.invalidate(undefined, existing.locationId)
			return result
		})
	}

	async handleRemove(id: number): Promise<EntityRef> {
		return record('ProductCategoryService.handleRemove', async () => {
			const existing = await this.repo.findById(id)
			if (!existing) throw CategoryError.notFound(id)

			const result = await this.repo.remove(id)
			if (!result) throw CategoryError.notFound(id)

			await this.invalidate(id, existing.locationId)
			return result
		})
	}

	async handleHardRemove(id: number): Promise<EntityRef> {
		return record('ProductCategoryService.handleHardRemove', async () => {
			const existing = await this.repo.findById(id)
			if (!existing) throw CategoryError.notFound(id)

			const result = await this.repo.remove(id)
			if (!result) throw CategoryError.notFound(id)

			await this.invalidate(id, existing.locationId)
			return result
		})
	}
}
