import Elysia from 'elysia'

import type { HRServiceModule } from '../service'
import { initHRRoute } from './hr.route'
import { initPayrollRoute } from './payroll.route'

export function initHRRouteModule(service: HRServiceModule) {
	const hrRouter = initHRRoute(service.hr)
	const payrollRouter = initPayrollRoute(service.payroll)

	return new Elysia({ prefix: '/hr' }).use(hrRouter).use(payrollRouter)
}
