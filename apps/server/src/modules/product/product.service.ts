import { CacheService, type CacheClient } from '@/infra/cache'

import { ConflictError, NotFoundError } from '@/shared/errors/http-error'

import type { WithPaginationResult } from '@/shared/types/pagination'
import type { ActorId, EntityRef } from '@/shared/types/utils'

import type { ProductCategoryDto } from './category.contract'
import type { ProductCategoryService } from './category.service'
import { ProductRepo } from './product.repo'
import type {
	ProductDto,
	ProductFilterDto,
	ProductMutationDto,
	ProductSelectDto,
} from './product.contract'

export class ProductService {
	private readonly cache: CacheService

	constructor(
		private readonly categorySvc: ProductCategoryService,
		private readonly repo: ProductRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'product')
	}

	/* --------------------------------- PRIVATE -------------------------------- */

	private validateDefaultVariant(variants: { isDefault?: boolean; name: string }[]) {
		const defaults = variants.filter((v) => v.isDefault)
		if (defaults.length > 1) {
			throw new ConflictError('Only one variant can be set as default', { code: 'MULTIPLE_DEFAULT_VARIANTS' })
		}
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<ProductDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: `byId:${id}`,
			factory: () => this.repo.getById(id),
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: ProductFilterDto,
	): Promise<WithPaginationResult<ProductSelectDto>> {
		const result = await this.repo.getListPaginated(filter)

		const allCategories = await this.categorySvc.handleList({
			q: undefined,
			locationId: filter.locationId,
			page: 1,
			limit: 1000,
		})
		const categoriesMap = new Map<number, ProductCategoryDto>(
			allCategories.data.map((cat) => [cat.id, cat]),
		)

		const data: ProductSelectDto[] = result.data.map((p) => ({
			...p,
			category: p.categoryId ? (categoriesMap.get(p.categoryId) ?? null) : null,
		}))

		return { data, meta: result.meta }
	}

	async handleDetail(id: number): Promise<ProductSelectDto> {
		const product = await this.getById(id)
		if (!product) throw new NotFoundError(`Product with ID ${id} not found`, { code: 'PRODUCT_NOT_FOUND' })

		const category = product.categoryId
			? ((await this.categorySvc.getById(product.categoryId)) ?? null)
			: null
		return { ...product, category }
	}

	async handleCreate(data: ProductMutationDto, actorId: ActorId): Promise<EntityRef> {
		const sku = data.sku.trim()
		const name = data.name.trim()

		await this.repo.checkScopedConflict(data.locationId, { sku, name })

		if (data.hasVariants && data.variants) {
			this.validateDefaultVariant(data.variants)
		}

		const result = await this.repo.create(data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count'] })

		return result
	}

	async handleUpdate(
		id: number,
		data: ProductMutationDto,
		actorId: ActorId,
	): Promise<EntityRef> {
		const existing = await this.getById(id)
		if (!existing) throw new NotFoundError(`Product with ID ${id} not found`, { code: 'PRODUCT_NOT_FOUND' })

		const sku = data.sku ? data.sku.trim() : existing.sku
		const name = data.name ? data.name.trim() : existing.name

		await this.repo.checkScopedConflict(data.locationId ?? existing.locationId, { sku, name }, id)

		if (data.hasVariants && data.variants) {
			this.validateDefaultVariant(data.variants)
		}

		await this.repo.update(id, data, actorId)

		await this.cache.deleteMany({ keys: ['list', 'count', `byId:${id}`] })

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
