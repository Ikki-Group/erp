import { createAuthRoute } from '@/modules/auth/auth.route'
import { createAuditLogRoute } from '@/modules/audit/audit-log.route'
import { createCompanyRoute } from '@/modules/company/company.route'
import { createCrmRouteModule } from '@/modules/crm'
import { initDashboardRouteModule } from '@/modules/dashboard'
import { initFinanceRouteModule } from '@/modules/finance'
import { initHRRouteModule } from '@/modules/hr'
import { createIamRoute } from '@/modules/iam/iam.route'
import { initInventoryRouteModule } from '@/modules/inventory'
import { createLocationRoute } from '@/modules/location/location.route'
import { initMaterialRoutes } from '@/modules/material'
import { initMokaRouteModule } from '@/modules/moka'
import { initPaymentRouteModule } from '@/modules/payment'
import { initProductRouteModule } from '@/modules/product'
import { initProductionRouteModule } from '@/modules/production'
import { initPurchasingRouteModule } from '@/modules/purchasing'
import { createRecipeRoute } from '@/modules/recipe'
import { createReportingRouteModule } from '@/modules/reporting'
import { initSalesRouteModule } from '@/modules/sales'
import { createSalesTypeRoute } from '@/modules/sales-type/sales-type.route'
import { createSupplierRoute } from '@/modules/supplier/supplier.route'
import { initSeedRoute } from '@/modules/tool/seed.route'
import { createUomRoute } from '@/modules/uom/uom.route'

import type { Modules } from './_registry'
import type Elysia from 'elysia'

/**
 * Route registry — mounts every module's HTTP surface.
 *
 * Order is not significant for correctness (Elysia composes independently), but
 * we keep it grouped by layer to mirror `_registry.ts`. Modules without an HTTP
 * surface (session) are intentionally absent.
 */
export function createRoutes(m: Modules) {
	const routes = [
		// Core
		createAuthRoute(m.auth),
		// Master data
		createAuditLogRoute(m.auditLog),
		createCompanyRoute(m.company),
		createLocationRoute(m.location),
		createUomRoute(m.uom),
		createSalesTypeRoute(m.salesType),
		createSupplierRoute(m.supplier),
		createCrmRouteModule(m.crm),
		initProductRouteModule(m.product),
		createRecipeRoute(m.recipe),
		initFinanceRouteModule(m.finance),
		createIamRoute(m.iam),
		initMaterialRoutes(m.material),
		// Operations
		initInventoryRouteModule(m.inventory),
		initProductionRouteModule(m.production),
		initPurchasingRouteModule(m.purchasing),
		initPaymentRouteModule(m.payment),
		initSalesRouteModule(m.sales),
		initHRRouteModule(m.hr),
		initMokaRouteModule(m.moka),
		// Aggregators
		initDashboardRouteModule(m.dashboard),
		createReportingRouteModule(m.reporting),
		// Tooling
		initSeedRoute(m.tool.seed),
	]

	return {
		register: (app: Elysia): Elysia => {
			routes.forEach((route) => app.use(route))
			return app
		},
	}
}
