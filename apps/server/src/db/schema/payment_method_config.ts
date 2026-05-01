import { boolean, index, pgTable, text } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { paymentMethodCategoryEnum, paymentMethodEnum } from './_helpers'

/**
 * Payment Method Configuration Table
 *
 * Global configuration for payment methods with cash/cashless flags.
 */
export const paymentMethodConfigsTable = pgTable(
	'payment_method_configs',
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

		...auditColumns,
	},
	(t) => [
		index('payment_method_configs_type_idx').on(t.type),
		index('payment_method_configs_category_idx').on(t.category),
		index('payment_method_configs_is_enabled_idx').on(t.isEnabled),
	],
)
