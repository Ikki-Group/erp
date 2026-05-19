import { isNull } from 'drizzle-orm'
import { integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditFullColumns, pk } from './_helpers'
import { accountsTable } from './finance'

/**
 * Taxes Table
 *
 * Defines tax rates (e.g., PPN, Service Charge) and their associated accounting mappings.
 */
export const taxesTable = pgTable(
	'taxes',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		/** Tax rate in percentage (e.g., 11.00 for 11%) */
		rate: numeric({ precision: 5, scale: 2 }).notNull().default('0'),
		/** Accounting mapping: Where to record the tax liability/asset */
		accountId: integer('account_id').references(() => accountsTable.id, { onDelete: 'restrict' }),
		description: text('description'),
		...auditFullColumns,
	},
	(t) => [uniqueIndex('taxes_code_idx').on(t.code).where(isNull(t.deletedAt))],
)
