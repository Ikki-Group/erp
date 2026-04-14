import Elysia from 'elysia'

import type { ProductServiceModule } from '../service'
import { initProductCategoryRoute } from './product-category.route'
import { initProductRoute } from './product.route'
import { initSalesTypeRoute } from './sales-type.route'

export function initProductRouteModule(service: ProductServiceModule) {
	const categoryRouter = initProductCategoryRoute(service)
	const salesTypeRouter = initSalesTypeRoute(service)
	const productRouter = initProductRoute(service)

	return new Elysia({ prefix: '/product' })
		.use(categoryRouter)
		.use(salesTypeRouter)
		.use(productRouter)
}
