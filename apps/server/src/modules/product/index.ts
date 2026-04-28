import { Elysia } from 'elysia'

import { initProductCategoryRoute } from './product-category/product-category.route'
import { ProductCategoryService } from './product-category/product-category.service'
import { initProductRoute } from './product/product.route'
import { ProductService } from './product/product.service'
import { initSalesTypeRoute } from './sales-type/sales-type.route'
import { SalesTypeService } from './sales-type/sales-type.service'

export class ProductServiceModule {
	public readonly category: ProductCategoryService
	public readonly salesType: SalesTypeService
	public readonly product: ProductService

	constructor() {
		this.category = new ProductCategoryService()
		this.salesType = new SalesTypeService()
		this.product = new ProductService(this.category)
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
