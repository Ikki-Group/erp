// import { integer, numeric, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

// import { auditBasicColumns, pk } from './_helpers.ts'
// import { usersTable } from './iam'

// export const employeesTable = pgTable(
// 	'employees',
// 	{
// 		...pk,
// 		code: text().notNull(),
// 		name: text().notNull(),
// 		email: text(),
// 		phone: text(),
// 		address: text(),
// 		/** Citizen ID (Nomor Induk Kependudukan) */
// 		nik: text('nik'),
// 		/** Tax ID (Nomor Pokok Wajib Pajak) */
// 		npwp: text('npwp'),
// 		jobTitle: text('job_title'),
// 		department: text('department'),
// 		baseSalary: numeric('base_salary').notNull().default('0'),
// 		bankAccount: text('bank_account'),
// 		hireDate: timestamp('hire_date', { mode: 'date' }),
// 		terminationDate: timestamp('termination_date', { mode: 'date' }),
// 		emergencyContact: text('emergency_contact'),
// 		userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
// 		...auditBasicColumns,
// 	},
// 	(t) => [uniqueIndex('employees_code_idx').on(t.code)],
// )
