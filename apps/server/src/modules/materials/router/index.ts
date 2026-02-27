import Elysia from 'elysia'

import type { MaterialServiceModule } from '../service'

import { initMaterialCategoryRoute } from './material-category.route'
import { initMaterialRoute } from './material.route'
import { initMaterialUomRoute } from './uom.route'

export function initMaterialsRouteModule(service: MaterialServiceModule) {
  const categoryRouter = initMaterialCategoryRoute(service)
  const uomRouter = initMaterialUomRoute(service)
  const materialRouter = initMaterialRoute(service)

  return new Elysia({ prefix: '/materials' }).use(categoryRouter).use(uomRouter).use(materialRouter)
}
