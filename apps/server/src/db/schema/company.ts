import { pgTable, text, integer, numeric, jsonb } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

/**
 * Company Settings Table
 *
 * Stores company-wide configuration settings like tax rates, company info, etc.
 */
export const companySettingsTable = pgTable('company_settings', {
	...pk,
	/** Company name */
	name: text('name').notNull(),
	/** Company address */
	address: text('address'),
	/** Company phone */
	phone: text('phone'),
	/** Company email */
	email: text('email'),
	/** Tax ID / NPWP in Indonesia */
	taxId: text('tax_id'),
	/** Tax rate percentage (e.g., 11 for 11%) */
	taxRate: numeric({ precision: 5, scale: 2 }).default('0').notNull(),
	/** Company logo URL */
	logoUrl: text('logo_url'),
	/** Invoice footer text */
	invoiceFooter: text('invoice_footer'),
	/** Receipt footer text */
	receiptFooter: text('receipt_footer'),
	/** Currency code (e.g., IDR, USD) */
	currencyCode: text('currency_code').default('IDR').notNull(),
	/** Currency symbol (e.g., Rp, $) */
	currencySymbol: text('currency_symbol').default('Rp').notNull(),
	/** Additional settings stored as JSON */
	settings: jsonb('settings'),
	...auditColumns,
})
