import { integer, numeric, pgTable, text, timestamp, pgEnum, time } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { employeesTable } from './employee'
import { locationsTable } from './location'

export const attendanceStatusEnum = pgEnum('attendance_status', [
	'present',
	'absent',
	'late',
	'on_leave',
])

export const shiftsTable = pgTable('shifts', {
	...pk,
	name: text().notNull(), // e.g., 'Morning Shift', 'Night Shift'
	startTime: time('start_time').notNull(),
	endTime: time('end_time').notNull(),
	note: text(),
	...auditColumns,
})

export const attendancesTable = pgTable('attendances', {
	...pk,
	employeeId: integer('employee_id')
		.notNull()
		.references(() => employeesTable.id),
	locationId: integer('location_id')
		.notNull()
		.references(() => locationsTable.id),
	shiftId: integer('shift_id').references(() => shiftsTable.id),

	date: timestamp({ mode: 'date' }).notNull().defaultNow(),
	clockIn: timestamp('clock_in', { mode: 'date' }),
	clockOut: timestamp('clock_out', { mode: 'date' }),

	status: attendanceStatusEnum().notNull().default('present'),
	note: text(),

	...auditColumns,
})

export const payrollStatusEnum = pgEnum('payroll_status', [
	'draft',
	'approved',
	'paid',
	'cancelled',
])

export const payrollBatchesTable = pgTable('payroll_batches', {
	...pk,
	name: text().notNull(), // e.g., 'March 2024 Payroll'
	periodMonth: integer('period_month').notNull(),
	periodYear: integer('period_year').notNull(),
	status: payrollStatusEnum().notNull().default('draft'),
	totalAmount: numeric('total_amount').notNull().default('0'),
	note: text(),
	...auditColumns,
})

export const payrollItemsTable = pgTable('payroll_items', {
	...pk,
	batchId: integer('batch_id')
		.notNull()
		.references(() => payrollBatchesTable.id),
	employeeId: integer('employee_id')
		.notNull()
		.references(() => employeesTable.id),

	baseSalary: numeric('base_salary').notNull().default('0'),
	adjustmentsAmount: numeric('adjustments_amount').notNull().default('0'),
	serviceChargeAmount: numeric('service_charge_amount').notNull().default('0'),
	totalAmount: numeric('total_amount').notNull().default('0'),

	note: text(),
	...auditColumns,
})

export const payrollAdjustmentTypeEnum = pgEnum('payroll_adjustment_type', [
	'addition',
	'deduction',
])

export const payrollAdjustmentsTable = pgTable('payroll_adjustments', {
	...pk,
	payrollItemId: integer('payroll_item_id')
		.notNull()
		.references(() => payrollItemsTable.id),
	type: payrollAdjustmentTypeEnum().notNull(),
	amount: numeric('amount').notNull().default('0'),
	reason: text().notNull(),
	...auditColumns,
})
