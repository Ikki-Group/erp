import { Elysia } from 'elysia'

import type { DbClient } from '@/core/database'

import type { CacheClient } from '@/lib/cache'

import type { FinanceServiceModule } from '@/modules/finance'

interface HRServiceModuleDeps {
	finance: FinanceServiceModule
}

import { EmployeeRepo } from './employee/employee.repo'
import { initEmployeeRoute } from './employee/employee.route'
import { EmployeeService } from './employee/employee.service'
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
	public readonly employee: EmployeeService
	public readonly hr: HRService
	public readonly payroll: PayrollService
	public readonly leaveRequest: LeaveRequestService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: HRServiceModuleDeps,
	) {
		const employeeRepo = new EmployeeRepo(this.db)
		this.employee = new EmployeeService(employeeRepo, this.cacheClient)

		const hrRepo = new HRRepo(this.db)
		this.hr = new HRService(hrRepo, this.cacheClient)

		const payrollRepo = new PayrollRepo(this.db)
		this.payroll = new PayrollService(
			this.deps.finance.account,
			this.deps.finance.journal,
			payrollRepo,
			this.db,
			this.cacheClient,
		)

		const leaveRequestRepo = new LeaveRequestRepo(this.db)
		this.leaveRequest = new LeaveRequestService(leaveRequestRepo, this.cacheClient)
	}
}

export function initHRRouteModule(s: HRServiceModule) {
	return new Elysia({ prefix: '/hr' })
		.use(initEmployeeRoute(s.employee))
		.use(initHRRoute(s.hr))
		.use(initPayrollRoute(s.payroll))
		.use(initLeaveRequestRoute(s.leaveRequest))
}

export * from './employee/employee.dto'
export type { EmployeeService } from './employee/employee.service'
export {
	ShiftDto,
	ShiftCreateDto,
	ShiftUpdateDto,
	AttendanceDto,
	AttendanceSelectDto,
	AttendanceFilterDto,
	ClockInDto,
	ClockOutDto,
	AttendanceStatusEnum,
	type AttendanceStatus,
} from './hr/hr.dto'
export {
	LeaveRequestDto,
	LeaveRequestCreateDto,
	LeaveRequestUpdateDto,
	LeaveRequestFilterDto,
} from './leave-request/leave-request.dto'
export {
	PayrollBatchDto,
	PayrollBatchCreateDto,
	PayrollItemDto,
	PayrollAdjustmentDto,
	PayrollAdjustmentCreateDto,
	PayrollStatusEnum,
	PayrollAdjustmentTypeEnum,
	type PayrollStatus,
	type PayrollAdjustmentType,
} from './payroll/payroll.dto'
