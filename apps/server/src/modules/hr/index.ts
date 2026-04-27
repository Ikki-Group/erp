import { Elysia } from 'elysia'

import type { FinanceServiceModule } from '@/modules/finance'

import { initHRRoute } from './hr/hr.route'
import { HRService } from './hr/hr.service'
import { initPayrollRoute } from './payroll/payroll.route'
import { PayrollService } from './payroll/payroll.service'

export class HRServiceModule {
	public readonly hr: HRService
	public readonly payroll: PayrollService

	constructor(finance: FinanceServiceModule) {
		this.hr = new HRService()
		this.payroll = new PayrollService(finance.account, finance.journal)
	}
}

export function initHRRouteModule(s: HRServiceModule) {
	return new Elysia({ prefix: '/hr' }).use(initHRRoute(s.hr)).use(initPayrollRoute(s.payroll))
}

// Feature exports - HR
export * from './hr/hr.dto'
export * from './hr/hr.repo'
export * from './hr/hr.service'
export * from './hr/hr.route'

// Feature exports - Payroll
export * from './payroll/payroll.dto'
export * from './payroll/payroll.repo'
export * from './payroll/payroll.service'
export * from './payroll/payroll.route'

