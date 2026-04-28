import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { FinanceServiceModule } from '@/modules/finance'

import { HRRepo } from './hr/hr.repo'
import { initHRRoute } from './hr/hr.route'
import { HRService } from './hr/hr.service'
import { PayrollRepo } from './payroll/payroll.repo'
import { initPayrollRoute } from './payroll/payroll.route'
import { PayrollService } from './payroll/payroll.service'

export class HRServiceModule {
	public readonly hr: HRService
	public readonly payroll: PayrollService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		finance: FinanceServiceModule,
	) {
		const hrRepo = new HRRepo(this.db, this.cacheClient)
		const payrollRepo = new PayrollRepo(this.db, this.cacheClient)

		this.hr = new HRService(hrRepo)
		this.payroll = new PayrollService(finance.account, finance.journal, payrollRepo, this.db)
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
