import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { CustomerDto, CustomerLoyaltyTransactionDto } from './customer.contract'
import { CustomerRepo } from './customer.repo'
import { initCustomerRoute } from './customer.route'
import { CustomerService } from './customer.service'

export class CrmServiceModule {
	public readonly customer: CustomerService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new CustomerRepo(db)
		this.customer = new CustomerService(repo, cacheClient)
	}
}

export type CrmModule = CrmServiceModule

export function initCrmRouteModule(service: CrmServiceModule) {
	const customerRouter = initCustomerRoute(service.customer)

	return new Elysia({ prefix: '/crm' }).use(customerRouter)
}

export type { CustomerDto, CustomerLoyaltyTransactionDto }
export type { CustomerService } from './customer.service'
