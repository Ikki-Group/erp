import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { CrmServiceModule as CrmModule } from '@/modules/crm'
import type { LocationModule } from '@/modules/location'
import type { ProductServiceModule as ProductModule } from '@/modules/product'

import { createSalesTypeRoute, type SalesTypeModule } from '../sales-type'
import { SalesInvoiceRepo } from './sales-invoice/sales-invoice.repo'
import { initSalesInvoiceRoute } from './sales-invoice/sales-invoice.route'
import { SalesInvoiceService } from './sales-invoice/sales-invoice.service'
import { SalesOrderRepo } from './sales-order/sales-order.repo'
import { createSalesOrderRoute } from './sales-order/sales-order.route'
import {
	SalesOrderService,
	type LocationReadPort,
	type CustomerReadPort,
	type SalesTypeReadPort,
	type ProductReadPort,
} from './sales-order/sales-order.service'

interface SalesServiceModuleDeps {
	location: LocationModule
	crm: CrmModule
	product: ProductModule
	salesType: SalesTypeModule
}

export class SalesModule {
	public readonly order: SalesOrderService
	public readonly invoice: SalesInvoiceService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		public readonly deps: SalesServiceModuleDeps,
	) {
		const salesOrderRepo = new SalesOrderRepo(this.db)
		const orderDeps: {
			location: LocationReadPort
			customer: CustomerReadPort
			salesType: SalesTypeReadPort
			product: ProductReadPort
		} = {
			location: deps.location,
			customer: deps.crm.customer,
			salesType: deps.salesType,
			product: deps.product.product,
		}
		this.order = new SalesOrderService(salesOrderRepo, this.cacheClient, orderDeps)

		const salesInvoiceRepo = new SalesInvoiceRepo(this.db)
		this.invoice = new SalesInvoiceService(salesInvoiceRepo, this.cacheClient)
	}
}

export function initSalesRouteModule(s: SalesModule) {
	return new Elysia({ prefix: '/sales' })
		.use(createSalesOrderRoute(s.order))
		.use(initSalesInvoiceRoute(s.invoice))
		.use(createSalesTypeRoute(s.deps.salesType))
}

export * from './sales-order/sales-order.contract'
export * from './sales-invoice/sales-invoice.contract'
export type { SalesOrderService } from './sales-order/sales-order.service'
export type { SalesInvoiceService } from './sales-invoice/sales-invoice.service'
