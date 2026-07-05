import { Elysia } from 'elysia'

import { createCustomerRoute } from './customer.route'
import type { CrmModule } from './crm.module'

export function createCrmRouteModule(m: CrmModule) {
	return new Elysia({ prefix: '/crm' }).use(createCustomerRoute(m.customer))
}
