import Elysia from 'elysia'

import type { MaterialServiceModule } from '../service'
import { initMaterialCategoryRoute } from './material-category.route'
import { initMaterialLocationRoute } from './material-location.route'
import { initMaterialRoute } from './material.route'
import { initMaterialUomRoute } from './uom.route'

export function initMaterialRouteModule(service: MaterialServiceModule) {
	const categoryRouter = initMaterialCategoryRoute(service)
	const uomRouter = initMaterialUomRoute(service)
	const materialRouter = initMaterialRoute(service)
	const locationRouter = initMaterialLocationRoute(service)

	return new Elysia({ prefix: '/material' })
		.use(categoryRouter)
		.use(uomRouter)
		.use(materialRouter)
		.use(locationRouter)
}
