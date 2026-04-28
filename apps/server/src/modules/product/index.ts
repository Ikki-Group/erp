import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { ProductCategoryRepo } from './product-category/product-category.repo'
import { initProductCategoryRoute } from './product-category/product-category.route'
import { ProductCategoryService } from './product-category/product-category.service'
import { ProductRepo } from './product/product.repo'
import { initProductRoute } from './product/product.route'
import { ProductService } from './product/product.service'
import { SalesTypeRepo } from './sales-type/sales-type.repo'
import { initSalesTypeRoute } from './sales-type/sales-type.route'
import { SalesTypeService } from './sales-type/sales-type.service'

export class ProductServiceModule {
	public readonly category: ProductCategoryService
	public readonly salesType: SalesTypeService
	public readonly product: ProductService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const productCategoryRepo = new ProductCategoryRepo(this.db, this.cacheClient)
		this.category = new ProductCategoryService(productCategoryRepo)

		const salesTypeRepo = new SalesTypeRepo(this.db, this.cacheClient)
		this.salesType = new SalesTypeService(salesTypeRepo)

		const productRepo = new ProductRepo(this.db, this.cacheClient)
		this.product = new ProductService(this.category, productRepo)
	}
}

export function initProductRouteModule(s: ProductServiceModule) {
	return new Elysia({ prefix: '/product' })
		.use(initProductCategoryRoute(s.category))
		.use(initSalesTypeRoute(s.salesType))
		.use(initProductRoute(s.product))
}

// Feature exports - Product Category
export * from './product-category/product-category.dto'
export * from './product-category/product-category.repo'
export * from './product-category/product-category.service'
export * from './product-category/product-category.route'

// Feature exports - Sales Type
export * from './sales-type/sales-type.dto'
export * from './sales-type/sales-type.repo'
export * from './sales-type/sales-type.service'
export * from './sales-type/sales-type.route'

// Feature exports - Product
export * from './product/product.dto'
export * from './product/product.repo'
export * from './product/product.service'
export * from './product/product.route'
