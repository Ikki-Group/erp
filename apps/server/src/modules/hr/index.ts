import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { FinanceModule } from '@/modules/finance'

import { createEmployeeModule, type EmployeeModule } from './employee/employee.module'
import { createEmployeeRoute } from './employee/employee.route'
import { createHRModule, type HRModule } from './hr'
import { initHRRoute } from './hr/hr.route'
import { createLeaveRequestModule, type LeaveRequestModule } from './leave-request'
import { initLeaveRequestRoute } from './leave-request/leave-request.route'
import { createPayrollModule, type PayrollModule } from './payroll'
import { initPayrollRoute } from './payroll/payroll.route'

interface HRServiceModuleDeps {
	finance: FinanceModule
}

export interface HRServiceModule {
	employee: EmployeeModule
	hr: HRModule
	payroll: PayrollModule
	leaveRequest: LeaveRequestModule
}

export function createHRServiceModule(
	db: DbClient,
	cacheClient: CacheClient,
	deps: HRServiceModuleDeps,
): HRServiceModule {
	const employee = createEmployeeModule(db, cacheClient)
	const hr = createHRModule(db, cacheClient)
	const payroll = createPayrollModule(db, cacheClient, {
		account: deps.finance.account,
		journal: deps.finance.journal,
	})
	const leaveRequest = createLeaveRequestModule(db, cacheClient)

	return { employee, hr, payroll, leaveRequest }
}

export function initHRRouteModule(s: HRServiceModule) {
	return new Elysia({ prefix: '/hr' })
		.use(createEmployeeRoute(s.employee))
		.use(initHRRoute(s.hr))
		.use(initPayrollRoute(s.payroll))
		.use(initLeaveRequestRoute(s.leaveRequest))
}

export * from './employee/employee.contract'
export type { IEmployeeRepo } from './employee/employee.repo'
export type { EmployeeModule } from './employee/employee.module'
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
} from './hr/hr.contract'
export {
	LeaveRequestDto,
	LeaveRequestCreateDto,
	LeaveRequestUpdateDto,
	LeaveRequestFilterDto,
} from './leave-request/leave-request.contract'
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
} from './payroll/payroll.contract'
