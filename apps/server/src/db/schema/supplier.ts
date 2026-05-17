import { isNull } from 'drizzle-orm'
import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers.ts'

export const suppliersTable = pgTable(
	'suppliers',
	{
		...pk,
		code: text().notNull(),
		name: text().notNull(),
		email: text(),
		phone: text(),
		address: text(),
		taxId: text('tax_id'),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('suppliers_code_idx').on(t.code).where(isNull(t.deletedAt)),
		uniqueIndex('suppliers_name_idx').on(t.name).where(isNull(t.deletedAt)),
	],
)
