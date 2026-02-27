import Elysia from 'elysia'

import type { MaterialServiceModule } from '../service'

import { initMaterialCategoryRoute } from './material-category.route'
import { initMaterialUomRoute } from './uom.route'

export function initMaterialsRouteModule(service: MaterialServiceModule) {
  const categoryRouter = initMaterialCategoryRoute(service)
  const uomRouter = initMaterialUomRoute(service)

  return new Elysia({ prefix: '/materials' }).use(categoryRouter).use(uomRouter)
}
