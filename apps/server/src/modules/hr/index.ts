import { Elysia } from 'elysia'

import type { CacheClient } from '@/core/cache'
import type { DbClient } from '@/core/database'

import type { FinanceServiceModule } from '@/modules/finance'

interface HRServiceModuleDeps {
	finance: FinanceServiceModule
}

import { HRRepo } from './hr/hr.repo'
import { initHRRoute } from './hr/hr.route'
import { HRService } from './hr/hr.service'
import { LeaveRequestRepo } from './leave-request/leave-request.repo'
import { initLeaveRequestRoute } from './leave-request/leave-request.route'
import { LeaveRequestService } from './leave-request/leave-request.service'
import { PayrollRepo } from './payroll/payroll.repo'
import { initPayrollRoute } from './payroll/payroll.route'
import { PayrollService } from './payroll/payroll.service'

export class HRServiceModule {
	public readonly hr: HRService
	public readonly payroll: PayrollService
	public readonly leaveRequest: LeaveRequestService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: HRServiceModuleDeps,
	) {
		const hrRepo = new HRRepo(this.db, this.cacheClient)
		const payrollRepo = new PayrollRepo(this.db, this.cacheClient)
		const leaveRequestRepo = new LeaveRequestRepo(this.db, this.cacheClient)

		this.hr = new HRService(hrRepo)
		this.payroll = new PayrollService(
			this.deps.finance.account,
			this.deps.finance.journal,
			payrollRepo,
			this.db,
		)
		this.leaveRequest = new LeaveRequestService(leaveRequestRepo)
	}
}

export function initHRRouteModule(s: HRServiceModule) {
	return new Elysia({ prefix: '/hr' })
		.use(initHRRoute(s.hr))
		.use(initPayrollRoute(s.payroll))
		.use(initLeaveRequestRoute(s.leaveRequest))
}
