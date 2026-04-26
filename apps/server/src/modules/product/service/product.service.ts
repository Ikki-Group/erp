import { record } from '@elysiajs/opentelemetry'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type { ProductCategoryDto } from '../dto/product-category.dto'
import type {
	ProductDto,
	ProductFilterDto,
	ProductMutationDto,
	ProductSelectDto,
} from '../dto/product.dto'
import { ProductRepo } from '../repo/product.repo'
import type { ProductCategoryService } from './product-category.service'

export class ProductService {
	constructor(
		private readonly categorySvc: ProductCategoryService,
		private readonly repo = new ProductRepo(),
	) {}

	/* --------------------------------- PRIVATE -------------------------------- */

	private validateDefaultVariant(variants: { isDefault?: boolean; name: string }[]) {
		const defaults = variants.filter((v) => v.isDefault)
		if (defaults.length > 1) {
			throw new ConflictError('Only one variant can be set as default', 'MULTIPLE_DEFAULT_VARIANTS')
		}
	}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<ProductDto> {
		return record('ProductService.getById', async () => {
			const product = await this.repo.getById(id)
			if (!product) throw new NotFoundError(`Product with ID ${id} not found`, 'PRODUCT_NOT_FOUND')
			return product
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(
		filter: ProductFilterDto,
	): Promise<WithPaginationResult<ProductSelectDto>> {
		return record('ProductService.handleList', async () => {
			const result = await this.repo.getListPaginated(filter)

			const allCategories = await this.categorySvc.handleList({}, { page: 1, limit: 1000 })
			const categoriesMap = new Map<number, any>(allCategories.data.map((cat) => [cat.id, cat]))

			const data: ProductSelectDto[] = result.data.map((p: any) => ({
				...p,
				category: p.categoryId ? (categoriesMap.get(p.categoryId) ?? null) : null,
			}))

			return { data, meta: result.meta }
		})
	}

	async handleDetail(id: number): Promise<ProductSelectDto> {
		return record('ProductService.handleDetail', async () => {
			const product = await this.getById(id)
			const category = product.categoryId
				? await this.categorySvc.getById(product.categoryId)
				: null
			return { ...product, category } as any
		})
	}

	async handleCreate(data: ProductMutationDto, actorId: number): Promise<{ id: number }> {
		return record('ProductService.handleCreate', async () => {
			const sku = data.sku.trim()
			const name = data.name.trim()

			await this.repo.checkScopedConflict(data.locationId, { sku, name })

			if (data.hasVariants && data.variants) {
				this.validateDefaultVariant(data.variants)
			}

			return this.repo.create(data, actorId)
		})
	}

	async handleUpdate(
		id: number,
		data: ProductMutationDto,
		actorId: number,
	): Promise<{ id: number }> {
		return record('ProductService.handleUpdate', async () => {
			const existing = await this.getById(id)

			const sku = data.sku ? data.sku.trim() : existing.sku
			const name = data.name ? data.name.trim() : existing.name

			await this.repo.checkScopedConflict(
				data.locationId ?? existing.locationId,
				{ sku, name },
				id,
			)

			if (data.hasVariants && data.variants) {
				this.validateDefaultVariant(data.variants)
			}

			return this.repo.update(id, data, actorId)
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('ProductService.handleRemove', async () => {
			return this.repo.softDelete(id, actorId)
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('ProductService.handleHardRemove', async () => {
			return this.repo.hardDelete(id)
		})
	}
}
