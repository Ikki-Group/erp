import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import { CustomerRepo } from './customer/customer.repo'
import { initCustomerRoute } from './customer/customer.route'
import { CustomerService } from './customer/customer.service'

export class CrmServiceModule {
	public readonly customer: CustomerService

	constructor(db: DbClient, cacheClient: CacheClient) {
		const repo = new CustomerRepo(db, cacheClient)
		this.customer = new CustomerService(repo)
	}
}

export function initCrmRouteModule(service: CrmServiceModule) {
	const customerRouter = initCustomerRoute(service.customer)

	return new Elysia({ prefix: '/crm' }).use(customerRouter)
}

export { CustomerDto, CustomerLoyaltyTransactionDto } from './customer/customer.dto'
export { CustomerService } from './customer/customer.service'
