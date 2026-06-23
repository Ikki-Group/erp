import { check, index, integer, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { auditFullColumns, pk } from './_helpers'
import { usersTable } from './iam'

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
		check('employees_base_salary_nonneg_chk', sql`base_salary >= 0`),
	],
)
