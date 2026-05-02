import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import { CrmReportingService } from './crm-reporting/crm-reporting.service'
import { FinanceReportingService } from './finance-reporting/finance-reporting.service'
import { InventoryReportingService } from './inventory-reporting/inventory-reporting.service'
import { PaymentReportingService } from './payment-reporting/payment-reporting.service'
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
		this.inventory = new InventoryReportingService(this.db)
		this.crm = new CrmReportingService(this.db)
		this.payment = new PaymentReportingService(this.db)
	}
}

export function initReportingRouteModule(s: ReportingServiceModule) {
	return new Elysia({ prefix: '/reporting' })
		.use(s.sales.routes)
		.use(s.finance.routes)
		.use(s.inventory.routes)
		.use(s.crm.routes)
		.use(s.payment.routes)
}
