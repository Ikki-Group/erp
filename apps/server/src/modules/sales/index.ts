import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { SalesInvoiceRepo } from './sales-invoice/sales-invoice.repo'
import { initSalesInvoiceRoute } from './sales-invoice/sales-invoice.route'
import { SalesInvoiceService } from './sales-invoice/sales-invoice.service'
import { SalesOrderRepo } from './sales-order/sales-order.repo'
import { initSalesOrderRoute } from './sales-order/sales-order.route'
import { SalesOrderService } from './sales-order/sales-order.service'
import { SalesTypeRepo } from './sales-type/sales-type.repo'
import { initSalesTypeRoute } from './sales-type/sales-type.route'
import { SalesTypeService } from './sales-type/sales-type.service'

export class SalesServiceModule {
	public readonly order: SalesOrderService
	public readonly salesType: SalesTypeService
	public readonly invoice: SalesInvoiceService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
	) {
		const salesOrderRepo = new SalesOrderRepo(this.db, this.cacheClient)
		this.order = new SalesOrderService(salesOrderRepo)

		const salesTypeRepo = new SalesTypeRepo(this.db, this.cacheClient)
		this.salesType = new SalesTypeService(salesTypeRepo)

		const salesInvoiceRepo = new SalesInvoiceRepo(this.db, this.cacheClient)
		this.invoice = new SalesInvoiceService(salesInvoiceRepo)
	}
}

export function initSalesRouteModule(s: SalesServiceModule) {
	return new Elysia({ prefix: '/sales' })
		.use(initSalesOrderRoute(s.order))
		.use(initSalesTypeRoute(s.salesType))
		.use(initSalesInvoiceRoute(s.invoice))
}

export * from './sales-order/sales-order.dto'
export * from './sales-type/sales-type.dto'
export * from './sales-invoice/sales-invoice.dto'
export type { SalesOrderService } from './sales-order/sales-order.service'
export type { SalesTypeService } from './sales-type/sales-type.service'
export type { SalesInvoiceService } from './sales-invoice/sales-invoice.service'
