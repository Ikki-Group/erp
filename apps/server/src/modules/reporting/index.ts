import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import { initCrmReportingRoute } from './crm-reporting/crm-reporting.route'
import { CrmReportingService } from './crm-reporting/crm-reporting.service'
import { initFinanceReportingRoute } from './finance-reporting/finance-reporting.route'
import { FinanceReportingService } from './finance-reporting/finance-reporting.service'
import { initInventoryReportingRoute } from './inventory-reporting/inventory-reporting.route'
import { InventoryReportingService } from './inventory-reporting/inventory-reporting.service'
import { initPaymentReportingRoute } from './payment-reporting/payment-reporting.route'
import { PaymentReportingService } from './payment-reporting/payment-reporting.service'
import { initSalesReportingRoute } from './sales-reporting/sales-reporting.route'
import { SalesReportingService } from './sales-reporting/sales-reporting.service'

export class ReportingServiceModule {
	public readonly sales: SalesReportingService
	public readonly finance: FinanceReportingService
	public readonly inventory: InventoryReportingService
	public readonly crm: CrmReportingService
	public readonly payment: PaymentReportingService

	constructor(private readonly db: DbClient) {
		this.sales = new SalesReportingService(this.db)
		this.finance = new FinanceReportingService(this.db)
		this.inventory = new InventoryReportingService()
		this.crm = new CrmReportingService(this.db)
		this.payment = new PaymentReportingService(this.db)
	}
}

export function initReportingRouteModule(s: ReportingServiceModule) {
	return new Elysia({ prefix: '/reporting' })
		.use(initSalesReportingRoute(s.sales))
		.use(initFinanceReportingRoute(s.finance))
		.use(initInventoryReportingRoute(s.inventory))
		.use(initCrmReportingRoute(s.crm))
		.use(initPaymentReportingRoute(s.payment))
}

export * from './reporting.dto'
