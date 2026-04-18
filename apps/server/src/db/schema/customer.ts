import { isNull } from 'drizzle-orm'
import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

/**
 * Customers Table
 *
 * Stores customer data for CRM and Sales.
 */
export const customersTable = pgTable(
	'customers',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		email: text('email'),
		phone: text('phone'),
		address: text('address'),
		/** Citizen ID or Tax ID (NPWP in Indonesia) */
		taxId: text('tax_id'),
		...auditColumns,
	},
	(t) => [
		uniqueIndex('customers_code_idx').on(t.code).where(isNull(t.deletedAt)),
		uniqueIndex('customers_name_idx').on(t.name).where(isNull(t.deletedAt)),
	],
)
