import { pgTable, pgEnum, varchar, numeric, uniqueIndex, boolean } from 'drizzle-orm/pg-core'

import { pk, auditBasicColumns } from './_helpers.ts'

// ─── Enums ───

export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])

// ─── Locations ───

export const locations = pgTable(
	'locations',
	{
		...pk,
		code: varchar('code', { length: 50 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		type: locationTypeEnum('type').notNull(),
		address: varchar('address', { length: 500 }),
		phone: varchar('phone', { length: 50 }),
		isActive: boolean('is_active').notNull().default(true),
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('locations_code_uniq').on(t.code)],
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
