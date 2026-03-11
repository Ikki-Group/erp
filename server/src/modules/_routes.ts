import { initAuthRoute } from './auth'
import { initDashboardRouteModule } from './dashboard'
import { initIamRouteModule } from './iam'
import { initInventoryRouteModule } from './inventory'
import { initLocationRouteModule } from './location'
import { initMaterialsRouteModule } from './materials'
import { initProductRouteModule } from './product'
import { initRecipeRouteModule } from './recipe'
import { initToolRouteModule } from './tool'

import type { Modules } from './_registry'

export function createRoutes(m: Modules) {
  return [
    initAuthRoute(m.auth.auth),
    initDashboardRouteModule(m.dashboard),
    initIamRouteModule(m.iam),
    initInventoryRouteModule(m.inventory),
    initLocationRouteModule(m.location),
    initMaterialsRouteModule(m.material),
    initProductRouteModule(m.product),
    initRecipeRouteModule(m.recipe),
    initToolRouteModule(m.tool),
  ]
}
