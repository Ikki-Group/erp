import { record } from '@elysiajs/opentelemetry'
import { NotFoundError } from '@/core/http/errors'
import type { WithPaginationResult } from '@/core/utils/pagination'

import type {
	ProductCategoryDto,
	ProductCategoryFilterDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
} from '../dto'
import { ProductCategoryRepo } from '../repo/product-category.repo'

export class ProductCategoryService {
	constructor(private readonly repo = new ProductCategoryRepo()) {}

	/* --------------------------------- PUBLIC --------------------------------- */

	async getById(id: number): Promise<ProductCategoryDto> {
		return record('ProductCategoryService.getById', async () => {
			const category = await this.repo.getById(id)
			if (!category) throw new NotFoundError(`Product category with ID ${id} not found`, 'PRODUCT_CATEGORY_NOT_FOUND')
			return category
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
			return this.repo.create(data, actorId)
		})
	}

	async handleUpdate(id: number, data: ProductCategoryUpdateDto, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleUpdate', async () => {
			return this.repo.update(id, data, actorId)
		})
	}

	async handleRemove(id: number, actorId: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleRemove', async () => {
			return this.repo.softDelete(id, actorId)
		})
	}

	async handleHardRemove(id: number): Promise<{ id: number }> {
		return record('ProductCategoryService.handleHardRemove', async () => {
			return this.repo.hardDelete(id)
		})
	}
}
