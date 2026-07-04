import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import type { ISalesOrderPort } from './sales-invoice.service'
import { SalesInvoiceRepo } from './sales-invoice.repo'
import { SalesInvoiceService } from './sales-invoice.service'

export type SalesInvoiceModule = SalesInvoiceService

export function createSalesInvoiceModule(
	db: DbContext,
	cacheClient: CacheClient,
	salesOrder: ISalesOrderPort,
): SalesInvoiceModule {
	const repo = new SalesInvoiceRepo(db)
	const service = new SalesInvoiceService(repo, salesOrder, cacheClient)

	return service
}
