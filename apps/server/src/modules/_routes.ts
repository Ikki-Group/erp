import { createAuthRoute } from '@/modules/auth/auth.route'
import { createIamRoute } from '@/modules/iam/iam.route'
import { createLocationRoute } from '@/modules/location/location.route'

import type { Modules } from './_registry'
import type Elysia from 'elysia'

export function createRoutes(m: Modules) {
	// const routes = [
	// 	createLocationRouteModule(m.location),
	// 	createIamRoute(m.iam),
	// 	// createAuthRouteModule(m.auth),
	// 	// initDashboardRouteModule(m.dashboard),
	// 	initInventoryRouteModule(m.inventory),
	// 	initMaterialRoutes(m.material),
	// 	// initProductRouteModule(m.product),
	// 	// initRecipeRouteModule(m.recipe),
	// 	// initToolRouteModule(m.tool),
	// 	// initMokaRouteModule(m.moka),
	// 	// initSalesRouteModule(m.sales),
	// 	// initSupplierRouteModule(m.supplier),
	// 	// initFinanceRouteModule(m.finance),
	// 	// initCrmRouteModule(m.crm),
	// 	// initCompanyRouteModule(m.company),
	// 	// initAuditRouteModule(m.audit),
	// 	// initPurchasingRouteModule(m.purchasing),
	// 	// initProductionRouteModule(m.production),
	// 	// initHRRouteModule(m.hr),
	// 	// initPaymentRouteModule(m.payment),
	// 	// initReportingRouteModule(m.reporting),
	// ]

	const routes = [createLocationRoute(m.location), createIamRoute(m.iam), createAuthRoute(m.auth)]

	return {
		register: (app: Elysia): Elysia => {
			routes.forEach((route) => app.use(route))
			return app
		},
	}
}
