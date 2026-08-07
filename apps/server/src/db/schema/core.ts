import { sql } from 'drizzle-orm'
import { pgTable, varchar, integer, numeric, check, uniqueIndex } from 'drizzle-orm/pg-core'

import { pk, auditBasicColumns } from './_helpers.ts'

// ─── Locations ───

export const locations = pgTable(
	'locations',
	{
		...pk,
		code: varchar('code', { length: 50 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		type: varchar('type', { length: 20 }).notNull(),
		address: varchar('address', { length: 500 }),
		phone: varchar('phone', { length: 50 }),
		isActive: integer('is_active').notNull().default(1),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('locations_code_uniq').on(t.code),
		check('locations_type_chk', sql`${t.type} IN ('store', 'warehouse')`),
	],
)

// ─── Company Settings ───

export const companySettings = pgTable('company_settings', {
	...pk,
	name: varchar('name', { length: 255 }).notNull(),
	address: varchar('address', { length: 500 }),
	phone: varchar('phone', { length: 50 }),
	email: varchar('email', { length: 255 }),
	taxId: varchar('tax_id', { length: 100 }),
	taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0'),
	currencyCode: varchar('currency_code', { length: 10 }).notNull().default('IDR'),
	currencySymbol: varchar('currency_symbol', { length: 10 }).notNull().default('Rp'),
	logoUrl: varchar('logo_url', { length: 500 }),
	receiptFooter: varchar('receipt_footer', { length: 1000 }),
	...auditBasicColumns,
})
