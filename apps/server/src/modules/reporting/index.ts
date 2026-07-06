import { Elysia } from 'elysia'

import type { DbContext } from '@/infra/database'

import { createBusinessInsightsModule } from './business-insights/business-insights.module'
import { createBusinessInsightsRoute } from './business-insights/business-insights.route'
import { createCrmReportingModule } from './crm-reporting/crm-reporting.module'
import { createCrmReportingRoute } from './crm-reporting/crm-reporting.route'
import { createFinanceReportingModule } from './finance-reporting/finance-reporting.module'
import { createFinanceReportingRoute } from './finance-reporting/finance-reporting.route'
import { createInventoryReportingModule } from './inventory-reporting/inventory-reporting.module'
import { createInventoryReportingRoute } from './inventory-reporting/inventory-reporting.route'
import { createPaymentReportingModule } from './payment-reporting/payment-reporting.module'
import { createPaymentReportingRoute } from './payment-reporting/payment-reporting.route'
import { createProcurementReportingModule } from './procurement-reporting/procurement-reporting.module'
import { createProcurementReportingRoute } from './procurement-reporting/procurement-reporting.route'
import { createSalesReportingModule } from './sales-reporting/sales-reporting.module'
import { createSalesReportingRoute } from './sales-reporting/sales-reporting.route'

export interface ReportingServiceModule {
	sales: ReturnType<typeof createSalesReportingModule>
	finance: ReturnType<typeof createFinanceReportingModule>
	inventory: ReturnType<typeof createInventoryReportingModule>
	procurement: ReturnType<typeof createProcurementReportingModule>
	crm: ReturnType<typeof createCrmReportingModule>
	payment: ReturnType<typeof createPaymentReportingModule>
	insights: ReturnType<typeof createBusinessInsightsModule>
}

export function createReportingServiceModule(db: DbContext): ReportingServiceModule {
	const sales = createSalesReportingModule(db)
	const finance = createFinanceReportingModule(db)
	const inventory = createInventoryReportingModule(db)
	const procurement = createProcurementReportingModule(db)
	const crm = createCrmReportingModule(db)
	const payment = createPaymentReportingModule(db)
	const insights = createBusinessInsightsModule(db)

	return { sales, finance, inventory, procurement, crm, payment, insights }
}

export function createReportingRouteModule(s: ReportingServiceModule) {
	return new Elysia({ prefix: '/reporting' })
		.use(createSalesReportingRoute(s.sales))
		.use(createFinanceReportingRoute(s.finance))
		.use(createInventoryReportingRoute(s.inventory))
		.use(createProcurementReportingRoute(s.procurement))
		.use(createBusinessInsightsRoute(s.insights))
		.use(createCrmReportingRoute(s.crm))
		.use(createPaymentReportingRoute(s.payment))
}

export * from './reporting.contract'
