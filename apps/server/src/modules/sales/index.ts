import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { CrmServiceModule } from '@/modules/crm'
import type { LocationServiceModule } from '@/modules/location'
import type { ProductServiceModule } from '@/modules/product'

import type { SalesTypeServiceModule } from '../sales-type'
import { SalesInvoiceRepo } from './sales-invoice/sales-invoice.repo'
import { initSalesInvoiceRoute } from './sales-invoice/sales-invoice.route'
import { SalesInvoiceService } from './sales-invoice/sales-invoice.service'
import { SalesOrderRepo } from './sales-order/sales-order.repo'
import { initSalesOrderRoute } from './sales-order/sales-order.route'
import { SalesOrderService } from './sales-order/sales-order.service'

interface SalesServiceModuleDeps {
	location: LocationServiceModule
	crm: CrmServiceModule
	product: ProductServiceModule
	salesType: SalesTypeServiceModule
}

export class SalesServiceModule {
	public readonly order: SalesOrderService
	public readonly invoice: SalesInvoiceService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: SalesServiceModuleDeps,
	) {
		const salesOrderRepo = new SalesOrderRepo(this.db)
		this.order = new SalesOrderService(salesOrderRepo, this.cacheClient, this.deps)

		const salesInvoiceRepo = new SalesInvoiceRepo(this.db)
		this.invoice = new SalesInvoiceService(salesInvoiceRepo, this.cacheClient)
	}
}

export function initSalesRouteModule(s: SalesServiceModule) {
	return new Elysia({ prefix: '/sales' })
		.use(initSalesOrderRoute(s.order))
		.use(initSalesInvoiceRoute(s.invoice))
}

export * from './sales-order/sales-order.dto'
export * from './sales-invoice/sales-invoice.dto'
export type { SalesOrderService } from './sales-order/sales-order.service'
export type { SalesInvoiceService } from './sales-invoice/sales-invoice.service'
