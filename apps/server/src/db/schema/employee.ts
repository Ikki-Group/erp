import { isNull } from 'drizzle-orm'
import { integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { usersTable } from './iam'

export const employeesTable = pgTable(
	'employees',
	{
		...pk,
		code: text().notNull(),
		name: text().notNull(),
		email: text(),
		phone: text(),
		jobTitle: text('job_title'),
		department: text('department'),
		baseSalary: numeric('base_salary').notNull().default('0'),
		bankAccount: text('bank_account'),
		userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
		...auditColumns,
	},
	(t) => [uniqueIndex('employees_code_idx').on(t.code).where(isNull(t.deletedAt))],
)
