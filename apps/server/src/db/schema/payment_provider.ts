import { index, pgTable, text, boolean } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers.ts'

/**
 * Payment Providers Table
 *
 * Master data for payment providers (e.g., BCA, BNI, Mandiri, GoPay, OVO).
 * Providers represent the financial institutions or payment services that process transactions.
 */
export const paymentProvidersTable = pgTable(
	'payment_providers',
	{
		...pk,

		/** Unique provider code (e.g., 'BCA', 'BNI', 'GOPAY') */
		code: text('code').notNull().unique(),

		/** Provider display name */
		name: text('name').notNull(),

		/** Provider description */
		description: text('description'),

		/** Provider website URL */
		websiteUrl: text('website_url'),

		/** Whether this provider is active */
		isActive: boolean('is_active').notNull().default(true),

		/** Whether this provider is a system default */
		isSystem: boolean('is_system').notNull().default(false),

		...auditBasicColumns,
	},
	(t) => [
		index('payment_providers_code_idx').on(t.code),
		index('payment_providers_is_active_idx').on(t.isActive),
	],
)
