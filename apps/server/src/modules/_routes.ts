import type { Modules } from './_registry'
/* eslint-disable eslint-plugin-import/max-dependencies */
import { initAuthRoute } from './auth'
import { initDashboardRouteModule } from './dashboard'
import { initIamRouteModule } from './iam'
import { initInventoryRouteModule } from './inventory'
import { initLocationRouteModule } from './location'
import { initMaterialRouteModule } from './material'
import { initMokaRouteModule } from './moka'
import { initProductRouteModule } from './product'
import { initRecipeRouteModule } from './recipe'
import { initSalesRouteModule } from './sales'
import { initToolRouteModule } from './tool'
import { initPurchasingRouteModule } from './purchasing'

import { initEmployeeRouteModule } from './employee'
import { initSupplierRouteModule } from './supplier'
import { initFinanceRouteModule } from './finance'

export function createRoutes(m: Modules) {
  return [
    initAuthRoute(m.auth.auth),
    initDashboardRouteModule(m.dashboard),
    initIamRouteModule(m.iam),
    initInventoryRouteModule(m.inventory),
    initLocationRouteModule(m.location),
    initMaterialRouteModule(m.material),
    initProductRouteModule(m.product),
    initRecipeRouteModule(m.recipe),
    initToolRouteModule(m.tool),
    initMokaRouteModule(m.moka),
    initSalesRouteModule(m.sales),
    initEmployeeRouteModule(m.employee),
    initSupplierRouteModule(m.supplier),
    initFinanceRouteModule(m.finance),
    initPurchasingRouteModule(m.purchasing),
  ]
}
