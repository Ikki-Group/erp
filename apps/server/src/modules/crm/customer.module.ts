import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { CustomerRepo } from './customer.repo'
import { CustomerService } from './customer.service'

export type CustomerModule = CustomerService

export function createCustomerModule(db: DbContext, cacheClient: CacheClient): CustomerModule {
	const repo = new CustomerRepo(db)
	const customer = new CustomerService(repo, cacheClient)

	return customer
}
