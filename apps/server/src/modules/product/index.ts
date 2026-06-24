import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'

import type { DbClient } from '@/infra/database'

import { ProductCategoryRepo } from './category.repo'
import { initProductCategoryRoute } from './category.route'
import type {
	ProductCategoryDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
	ProductCategoryFilterDto,
} from './category.contract'
import { ProductCategoryService } from './category.service'
import { ProductRepo } from './product.repo'
import { initProductRoute } from './product.route'
import type {
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
import { ProductService } from './product.service'

export class ProductServiceModule {
	public readonly category: ProductCategoryService
	public readonly product: ProductService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const productCategoryRepo = new ProductCategoryRepo(this.db)
		this.category = new ProductCategoryService(productCategoryRepo, this.cacheClient)

		const productRepo = new ProductRepo(this.db)
		this.product = new ProductService(this.category, productRepo, this.cacheClient)
	}
}

export function initProductRouteModule(s: ProductServiceModule) {
	return new Elysia({ prefix: '/product' })
		.use(initProductCategoryRoute(s.category))
		.use(initProductRoute(s.product))
}

export type {
	ProductCategoryDto,
	ProductCategoryCreateDto,
	ProductCategoryUpdateDto,
	ProductCategoryFilterDto,
	ProductDto,
	ProductSelectDto,
	ProductFilterDto,
	ProductCreateDto,
	ProductUpdateDto,
	ProductVariantDto,
	ProductPriceDto,
	VariantPriceDto,
	ProductExternalMappingDto,
}
export type { ProductCategoryService } from './category.service'
export type { ProductService } from './product.service'
