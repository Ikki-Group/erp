import type { Modules } from './_registry'
import { initAuthRoute } from './auth'
import { initDashboardRouteModule } from './dashboard'
import { initEmployeeRouteModule } from './employee'
import { initFinanceRouteModule } from './finance'
import { initHRRouteModule } from './hr'
import { initIamRouteModule } from './iam/router'
import { initInventoryRouteModule } from './inventory'
import { initLocationRouteModule } from './location'
import { initMaterialRouteModule } from './material'
import { initMokaRouteModule } from './moka'
import { initProductRouteModule } from './product'
import { initProductionRouteModule } from './production'
import { initPurchasingRouteModule } from './purchasing'
import { initRecipeRouteModule } from './recipe'
import { initSalesRouteModule } from './sales'
import { initSupplierRouteModule } from './supplier'
import { initToolRouteModule } from './tool'

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
		initProductionRouteModule(m.production),
		initHRRouteModule(m.hr),
	]
}
