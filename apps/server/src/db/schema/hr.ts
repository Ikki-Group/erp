import { check, index, integer, numeric, pgEnum, pgTable, text, time, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { between, gte } from 'drizzle-orm'

import { auditFullColumns, pk } from './_helpers'
import { usersTable } from './iam'
import { locationsTable } from './location'

export const employeesTable = pgTable(
	'employees',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		email: text('email'),
		phone: text('phone'),
		address: text('address'),
		/** Citizen ID (Nomor Induk Kependudukan) */
		nik: text('nik'),
		/** Tax ID (Nomor Pokok Wajib Pajak) */
		npwp: text('npwp'),
		jobTitle: text('job_title'),
		department: text('department'),
		baseSalary: numeric('base_salary', { precision: 18, scale: 2 }).notNull().default('0'),
		bankAccount: text('bank_account'),
		hireDate: timestamp('hire_date', { mode: 'date', withTimezone: true }),
		terminationDate: timestamp('termination_date', { mode: 'date', withTimezone: true }),
		emergencyContact: text('emergency_contact'),
		userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
		...auditFullColumns,
	},
	(t) => [
		uniqueIndex('employees_code_idx').on(t.code),
		index('employees_user_idx').on(t.userId),

		// Base salary must be non-negative
		check('employees_base_salary_nonneg_chk', gte(t.baseSalary, 0)),
	],
)

export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'on_leave'])

export const shiftsTable = pgTable('shifts', {
	...pk,
	name: text('name').notNull(), // e.g., 'Morning Shift', 'Night Shift'
	startTime: time('start_time').notNull(),
	endTime: time('end_time').notNull(),
	note: text('note'),
	...auditFullColumns,
})

export const attendancesTable = pgTable(
	'attendances',
	{
		...pk,
		employeeId: integer('employee_id')
			.notNull()
			.references(() => employeesTable.id, { onDelete: 'restrict' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),
		shiftId: integer('shift_id').references(() => shiftsTable.id, { onDelete: 'set null' }),

		date: timestamp('date', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
		clockIn: timestamp('clock_in', { mode: 'date', withTimezone: true }),
		clockOut: timestamp('clock_out', { mode: 'date', withTimezone: true }),

		status: attendanceStatusEnum('status').notNull().default('present'),
		note: text('note'),

		...auditFullColumns,
	},
	(t) => [
		index('attendances_employee_idx').on(t.employeeId),
		index('attendances_location_idx').on(t.locationId),
		index('attendances_date_idx').on(t.date),
		index('attendances_shift_idx').on(t.shiftId),
	],
)

export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'approved', 'paid', 'cancelled'])
export const payrollAdjustmentTypeEnum = pgEnum('payroll_adjustment_type', ['addition', 'deduction'])

export const payrollBatchesTable = pgTable(
	'payroll_batches',
	{
		...pk,
		name: text('name').notNull(), // e.g., 'March 2024 Payroll'
		periodMonth: integer('period_month').notNull(),
		periodYear: integer('period_year').notNull(),
		status: payrollStatusEnum('status').notNull().default('draft'),
		totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		note: text('note'),
		...auditFullColumns,
	},
	(t) => [
		index('payroll_batches_status_idx').on(t.status),
		index('payroll_batches_period_idx').on(t.periodYear, t.periodMonth),

		// Total amount must be non-negative
		check('payroll_batches_total_nonneg_chk', gte(t.totalAmount, 0)),
		// Period month must be 1-12
		check('payroll_batches_month_range_chk', between(t.periodMonth, 1, 12)),
	],
)

export const payrollItemsTable = pgTable(
	'payroll_items',
	{
		...pk,
		batchId: integer('batch_id')
			.notNull()
			.references(() => payrollBatchesTable.id, { onDelete: 'cascade' }),
		employeeId: integer('employee_id')
			.notNull()
			.references(() => employeesTable.id, { onDelete: 'restrict' }),

		baseSalary: numeric('base_salary', { precision: 18, scale: 2 }).notNull().default('0'),
		adjustmentsAmount: numeric('adjustments_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		serviceChargeAmount: numeric('service_charge_amount', { precision: 18, scale: 2 }).notNull().default('0'),
		totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0'),

		note: text('note'),
		...auditFullColumns,
	},
	(t) => [
		index('payroll_items_batch_idx').on(t.batchId),
		index('payroll_items_employee_idx').on(t.employeeId),

		// Amounts must be non-negative
		check('payroll_items_base_salary_nonneg_chk', gte(t.baseSalary, 0)),
		check('payroll_items_total_nonneg_chk', gte(t.totalAmount, 0)),
	],
)

export const payrollAdjustmentsTable = pgTable(
	'payroll_adjustments',
	{
		...pk,
		payrollItemId: integer('payroll_item_id')
			.notNull()
			.references(() => payrollItemsTable.id, { onDelete: 'cascade' }),
		type: payrollAdjustmentTypeEnum('type').notNull(),
		amount: numeric('amount', { precision: 18, scale: 2 }).notNull().default('0'),
		reason: text('reason').notNull(),
		...auditFullColumns,
	},
	(t) => [index('payroll_adjustments_item_idx').on(t.payrollItemId)],
)

export const leaveTypeEnum = pgEnum('leave_type', ['annual', 'sick', 'unpaid', 'other'])
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected', 'cancelled'])

export const leaveRequestsTable = pgTable(
	'leave_requests',
	{
		...pk,
		employeeId: integer('employee_id')
			.notNull()
			.references(() => employeesTable.id, { onDelete: 'cascade' }),
		type: leaveTypeEnum('type').notNull(),
		status: leaveStatusEnum('status').notNull().default('pending'),
		dateStart: timestamp('date_start', { mode: 'date', withTimezone: true }).notNull(),
		dateEnd: timestamp('date_end', { mode: 'date', withTimezone: true }).notNull(),
		reason: text('reason').notNull(),
		note: text('note'),
		...auditFullColumns,
	},
	(t) => [
		index('leave_requests_employee_idx').on(t.employeeId),
		index('leave_requests_status_idx').on(t.status),
		index('leave_requests_dates_idx').on(t.dateStart, t.dateEnd),

		// End date must be >= start date
		check('leave_requests_date_range_chk', gte(t.dateEnd, t.dateStart)),
	],
)
