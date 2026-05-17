import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core'

import { paymentMethodCategoryEnum, paymentMethodEnum } from './_helpers'
import { auditBasicColumns, pk } from './_helpers.ts'
import { paymentProvidersTable } from './payment_provider'

/**
 * Payment Methods Table
 *
 * Master data for payment methods with cash/cashless flags and global availability.
 * A payment method can be "global" (automatically available to all store locations)
 * or "location-specific" (mapped explicitly to certain stores).
 */
export const paymentMethodsTable = pgTable(
	'payment_methods',
	{
		...pk,
		type: paymentMethodEnum().notNull(),

		/** Cash vs cashless flag */
		category: paymentMethodCategoryEnum().notNull(),

		/** Display name for the payment method */
		name: text('name').notNull(),

		/** Whether this payment method is enabled */
		isEnabled: boolean('is_enabled').notNull().default(true),

		/** Whether this is the default payment method */
		isDefault: boolean('is_default').notNull().default(false),

		/** Whether this payment method is available globally to all stores */
		isGlobal: boolean('is_global').notNull().default(false),

		/** Reference to the payment provider (optional) */
		paymentProviderId: integer('payment_provider_id').references(() => paymentProvidersTable.id, {
			onDelete: 'set null',
		}),

		...auditBasicColumns,
	},
	(t) => [
		index('payment_methods_type_idx').on(t.type),
		index('payment_methods_category_idx').on(t.category),
		index('payment_methods_is_enabled_idx').on(t.isEnabled),
		index('payment_methods_is_global_idx').on(t.isGlobal),
		index('payment_methods_payment_provider_id_idx').on(t.paymentProviderId),
	],
)
