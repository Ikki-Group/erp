import type { Modules } from './_registry'
import { initAuditRouteModule } from './audit'
import { initAuthRouteModule } from './auth'
import { initCompanyRouteModule } from './company'
import { initDashboardRouteModule } from './dashboard'
import { initEmployeeRouteModule } from './employee'
import { initFinanceRouteModule } from './finance'
import { initHRRouteModule } from './hr'
import { initIamRouteModule } from './iam'
import { initInventoryRouteModule } from './inventory'
import { initLocationRouteModule } from './location'
import { initMaterialRouteModule } from './material'
import { initMokaRouteModule } from './moka'
import { initPaymentRouteModule } from './payment'
import { initProductRouteModule } from './product'
import { initProductionRouteModule } from './production'
import { initPurchasingRouteModule } from './purchasing'
import { initRecipeRouteModule } from './recipe'
import { initSalesRouteModule } from './sales'
import { initSupplierRouteModule } from './supplier'
import { initToolRouteModule } from './tool'
import type Elysia from 'elysia'

export function initRoutes(m: Modules) {
	const routes = [
		initAuthRouteModule(m.auth),
		initIamRouteModule(m.iam),
		initDashboardRouteModule(m.dashboard),
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
		initCrmRouteModule(m.crm),
		initCompanyRouteModule(m.company),
		initAuditRouteModule(m.audit),
		initPurchasingRouteModule(m.purchasing),
		initProductionRouteModule(m.production),
		initHRRouteModule(m.hr),
		initPaymentRouteModule(m.payment),
	]

	return {
		register: (app: Elysia): Elysia => {
			routes.forEach((route) => app.use(route))
			return app
		},
	}
}
