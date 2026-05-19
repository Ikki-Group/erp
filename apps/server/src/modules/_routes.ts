import type { Modules } from './_registry'
import { createLocationRouteModule } from './location'
import { initToolRouteModule } from './tool'
import type Elysia from 'elysia'

export function createRoutes(m: Modules) {
	const routes = [
		createLocationRouteModule(m.location),
		// createIamRouteModule(m.iam),
		// createAuthRouteModule(m.auth),
		// initDashboardRouteModule(m.dashboard),
		// initInventoryRouteModule(m.inventory),
		// initMaterialRoutes(m.material),
		// initProductRouteModule(m.product),
		// initRecipeRouteModule(m.recipe),
		initToolRouteModule(m.tool),
		// initMokaRouteModule(m.moka),
		// initSalesRouteModule(m.sales),
		// initSupplierRouteModule(m.supplier),
		// initFinanceRouteModule(m.finance),
		// initCrmRouteModule(m.crm),
		// initCompanyRouteModule(m.company),
		// initAuditRouteModule(m.audit),
		// initPurchasingRouteModule(m.purchasing),
		// initProductionRouteModule(m.production),
		// initHRRouteModule(m.hr),
		// initPaymentRouteModule(m.payment),
		// initReportingRouteModule(m.reporting),
	]

	return {
		register: (app: Elysia): Elysia => {
			routes.forEach((route) => app.use(route))
			return app
		},
	}
}
