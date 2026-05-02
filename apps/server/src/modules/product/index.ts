import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { ProductCategoryRepo } from './product-category/product-category.repo'
import { initProductCategoryRoute } from './product-category/product-category.route'
import { ProductCategoryService } from './product-category/product-category.service'
import { ProductRepo } from './product/product.repo'
import { initProductRoute } from './product/product.route'
import { ProductService } from './product/product.service'

export class ProductServiceModule {
	public readonly category: ProductCategoryService
	public readonly product: ProductService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const productCategoryRepo = new ProductCategoryRepo(this.db, this.cacheClient)
		this.category = new ProductCategoryService(productCategoryRepo)

		const productRepo = new ProductRepo(this.db, this.cacheClient)
		this.product = new ProductService(this.category, productRepo)
	}
}

export function initProductRouteModule(s: ProductServiceModule) {
	return new Elysia({ prefix: '/product' })
		.use(initProductCategoryRoute(s.category))
		.use(initProductRoute(s.product))
}
