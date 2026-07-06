import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { CrmServiceModule as CrmModule } from '@/modules/crm'
import type { LocationModule } from '@/modules/location'
import type { ProductModule } from '@/modules/product'

import { createSalesTypeRoute, type SalesTypeModule } from '../sales-type'
import {
	createSalesInvoiceModule,
	type SalesInvoiceModule,
	type ISalesOrderPort,
} from './sales-invoice'
import { createSalesInvoiceRoute } from './sales-invoice/sales-invoice.route'
import { createSalesOrderModule, type SalesOrderModule } from './sales-order'
import { createSalesOrderRoute } from './sales-order/sales-order.route'
import type {
	LocationReadPort,
	CustomerReadPort,
	SalesTypeReadPort,
	ProductReadPort,
} from './sales-order/sales-order.service'

interface SalesServiceModuleDeps {
	location: LocationModule
	crm: CrmModule
	product: ProductModule
	salesType: SalesTypeModule
}

export interface SalesModule {
	order: SalesOrderModule
	invoice: SalesInvoiceModule
	deps: SalesServiceModuleDeps
}

export function createSalesModule(
	db: DbClient,
	cacheClient: CacheClient,
	deps: SalesServiceModuleDeps,
): SalesModule {
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
	const order = createSalesOrderModule(db, cacheClient, orderDeps)

	const salesOrderPort: ISalesOrderPort = {
		findById: async (orderId: number) => {
			const result = await order.handleDetail(orderId)
			return result ? { id: result.id, status: result.status } : undefined
		},
		findItemsByOrderId: async (orderId: number, _db) => {
			const result = await order.handleDetail(orderId)
			return result?.items ?? []
		},
	}

	const invoice = createSalesInvoiceModule(db, cacheClient, salesOrderPort)

	return { order, invoice, deps }
}

export function initSalesRouteModule(s: SalesModule) {
	return new Elysia({ prefix: '/sales' })
		.use(createSalesOrderRoute(s.order))
		.use(createSalesInvoiceRoute(s.invoice))
		.use(createSalesTypeRoute(s.deps.salesType))
}

export * from './sales-order/sales-order.contract'
export * from './sales-invoice/sales-invoice.contract'
export type { SalesOrderService } from './sales-order/sales-order.service'
export type { SalesInvoiceModule } from './sales-invoice'
