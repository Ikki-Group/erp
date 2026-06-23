import { index, integer, pgTable, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'
import { locationsTable } from './location'
import { paymentMethodsTable } from './payment_methods'
import { paymentProvidersTable } from './payment_provider'

/**
 * Location Payment Methods Table
 *
 * Junction table that maps which payment methods are active for specific locations.
 * Stores location-specific credentials and configurations for each payment method.
 *
 * Business Rule: Only locations with type='store' can have payment methods.
 */
export const locationPaymentMethodsTable = pgTable(
	'location_payment_methods',
	{
		...pk,

		/** Reference to the location */
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'cascade' }),

		/** Reference to the payment method */
		paymentMethodId: integer('payment_method_id')
			.notNull()
			.references(() => paymentMethodsTable.id, { onDelete: 'cascade' }),

		/** Reference to the payment provider (optional) */
		paymentProviderId: integer('payment_provider_id').references(() => paymentProvidersTable.id, {
			onDelete: 'set null',
		}),

		/** Whether this payment method is enabled for this location */
		isEnabled: boolean('is_enabled').notNull().default(true),

		/** Whether this is the default payment method for this location */
		isDefault: boolean('is_default').notNull().default(false),

		/** Provider-specific credentials (e.g., merchant ID, API key, account number) */
		credentials: jsonb('credentials').$type<{
			merchantId?: string
			apiKey?: string
			accountNumber?: string
			terminalId?: string
			[key: string]: any
		}>(),

		/** Additional configuration for this location */
		config: jsonb('config').$type<{
			minAmount?: number
			maxAmount?: number
			feePercentage?: number
			fixedFee?: number
			[key: string]: any
		}>(),

		/** When this payment method was enabled for this location */
		enabledAt: timestamp('enabled_at', { mode: 'date', withTimezone: true }),

		...auditBasicColumns,
	},
	(t) => [
		index('location_payment_methods_location_id_idx').on(t.locationId),
		index('location_payment_methods_payment_method_id_idx').on(t.paymentMethodId),
		index('location_payment_methods_payment_provider_id_idx').on(t.paymentProviderId),
		index('location_payment_methods_is_enabled_idx').on(t.isEnabled),
	],
)
