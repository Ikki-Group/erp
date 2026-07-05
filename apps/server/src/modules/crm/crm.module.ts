import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { createCustomerModule, type CustomerModule } from './customer.module'

export type CrmServiceModule = {
	customer: CustomerModule
}

export type CrmModule = CrmServiceModule

export function createCrmModule(db: DbContext, cacheClient: CacheClient): CrmModule {
	const customer = createCustomerModule(db, cacheClient)
	return { customer }
}
