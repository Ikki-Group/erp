import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { ProductCategoryRepo } from './product-category/product-category.repo'
import { initProductCategoryRoute } from './product-category/product-category.route'
import type {
	ProductCategorySchema,
	ProductCategoryCreateSchema,
	ProductCategoryUpdateSchema,
	ProductCategoryFilterSchema,
} from './product-category/product-category.schema'
import { ProductCategoryService } from './product-category/product-category.service'
import { ProductRepo } from './product/product.repo'
import { initProductRoute } from './product/product.route'
import type {
	ProductSchema,
	ProductSelectSchema,
	ProductFilterSchema,
	ProductCreateSchema,
	ProductUpdateSchema,
	ProductVariantSchema,
	ProductPriceSchema,
	VariantPriceSchema,
	ProductExternalMappingSchema,
} from './product/product.schema'
import { ProductService } from './product/product.service'

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
	ProductCategorySchema,
	ProductCategoryCreateSchema,
	ProductCategoryUpdateSchema,
	ProductCategoryFilterSchema,
	ProductSchema,
	ProductSelectSchema,
	ProductFilterSchema,
	ProductCreateSchema,
	ProductUpdateSchema,
	ProductVariantSchema,
	ProductPriceSchema,
	VariantPriceSchema,
	ProductExternalMappingSchema,
}
export type { ProductCategoryService } from './product-category/product-category.service'
export type { ProductService } from './product/product.service'
