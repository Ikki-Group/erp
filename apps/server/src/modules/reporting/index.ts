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

export class ReportingServiceModule {
	public readonly sales: ReturnType<typeof createSalesReportingModule>
	public readonly finance: ReturnType<typeof createFinanceReportingModule>
	public readonly inventory: ReturnType<typeof createInventoryReportingModule>
	public readonly procurement: ReturnType<typeof createProcurementReportingModule>
	public readonly crm: ReturnType<typeof createCrmReportingModule>
	public readonly payment: ReturnType<typeof createPaymentReportingModule>
	public readonly insights: ReturnType<typeof createBusinessInsightsModule>

	constructor(db: DbContext) {
		this.sales = createSalesReportingModule(db)
		this.finance = createFinanceReportingModule(db)
		this.inventory = createInventoryReportingModule(db)
		this.procurement = createProcurementReportingModule(db)
		this.crm = createCrmReportingModule(db)
		this.payment = createPaymentReportingModule(db)
		this.insights = createBusinessInsightsModule(db)
	}
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
