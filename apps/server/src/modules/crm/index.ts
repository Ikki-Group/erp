export * from './customer.contract'
export type { ICustomerRepo } from './customer.repo'
export type { CustomerModule } from './customer.module'

import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbContext } from '@/infra/database'

import { createCustomerModule, type CustomerModule } from './customer.module'
import { createCustomerRoute } from './customer.route'

export type CrmServiceModule = {
	customer: CustomerModule
}

export type CrmModule = CrmServiceModule

export function createCrmModule(db: DbContext, cacheClient: CacheClient): CrmModule {
	const customer = createCustomerModule(db, cacheClient)
	return { customer }
}

export function createCrmRouteModule(m: CrmModule) {
	return new Elysia({ prefix: '/crm' }).use(createCustomerRoute(m.customer))
}
