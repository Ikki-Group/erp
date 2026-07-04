import { Elysia } from 'elysia'

import { createCategoryRoute } from './category.route'
import { createProductRoute } from './product.route'
import { createProductModule, type ProductModule } from './product.module'

export type { ProductModule }
export { createProductModule }

export function initProductRouteModule(m: ProductModule) {
	return new Elysia({ prefix: '/product' })
		.use(createCategoryRoute(m.category))
		.use(createProductRoute(m.product))
}

export type {
	ProductCategoryDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
	ProductCategoryFilterDto,
} from './category.contract'
export type { IProductCategoryRepo } from './category.repo'
export type { ProductCategoryService } from './category.service'

export type {
	ProductDto,
	ProductSelectDto,
	ProductFilterDto,
	ProductCreateDto,
	ProductUpdateDto,
	ProductVariantDto,
	ProductPriceDto,
	VariantPriceDto,
	ProductExternalMappingDto,
} from './product.contract'
export type { IProductRepo } from './product.repo'
export type { ProductService } from './product.service'

import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'
import { ProductCategoryRepo } from './category.repo'
import { ProductCategoryService } from './category.service'
import { ProductRepo } from './product.repo'
import { ProductService } from './product.service'

export class ProductServiceModule {
	public readonly category: ProductCategoryService
	public readonly product: ProductService

	constructor(
		db: DbContext,
		cacheClient: CacheClient,
	) {
		const categoryRepo = new ProductCategoryRepo(db)
		this.category = new ProductCategoryService(categoryRepo, cacheClient)

		const productRepo = new ProductRepo(db)
		this.product = new ProductService(categoryRepo, productRepo, cacheClient)
	}
}
