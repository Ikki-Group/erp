import { isNull } from 'drizzle-orm'
import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditFullColumns, pk } from './_helpers'

export const suppliersTable = pgTable(
	'suppliers',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		email: text('email'),
		phone: text('phone'),
		address: text('address'),
		taxId: text('tax_id'),
		...auditFullColumns,
	},
	(t) => [
		uniqueIndex('suppliers_code_idx').on(t.code).where(isNull(t.deletedAt)),
		uniqueIndex('suppliers_name_idx').on(t.name).where(isNull(t.deletedAt)),
	],
)
