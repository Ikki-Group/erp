import { between, isNull } from 'drizzle-orm'
import { check, index, integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditFullColumns, pk } from './_helpers'
import { accountsTable } from './finance'

/**
 * Taxes Table
 *
 * Defines tax rates (e.g., PPN, Service Charge) and their associated accounting mappings.
 *
 * ⚠ No owning module yet — `products.taxId` (see `product/core.ts`) is commented
 * out pending this. Kept flat at schema root (not nested under a domain
 * folder) since there is no `modules/tax/` to mirror. Move it under a real
 * domain folder once a module claims it.
 */
export const taxesTable = pgTable(
	'taxes',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		/** Tax rate in percentage (e.g., 11.00 for 11%) */
		rate: numeric('rate', { precision: 5, scale: 2 }).notNull().default('0'),
		/** Accounting mapping: Where to record the tax liability/asset */
		accountId: integer('account_id').references(() => accountsTable.id, { onDelete: 'restrict' }),
		description: text('description'),
		...auditFullColumns,
	},
	(t) => [
		uniqueIndex('taxes_code_idx').on(t.code).where(isNull(t.deletedAt)),
		index('taxes_account_idx').on(t.accountId),

		// Tax rate must be between 0 and 100%
		check('taxes_rate_range_chk', between(t.rate, 0, 100)),
	],
)
