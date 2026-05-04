import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

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

export function initCrmRouteModule(service: CrmServiceModule) {
	const customerRouter = initCustomerRoute(service.customer)

	return new Elysia({ prefix: '/crm' }).use(customerRouter)
}

export { CustomerDto, CustomerLoyaltyTransactionDto } from './customer.dto'
export { CustomerService } from './customer.service'
