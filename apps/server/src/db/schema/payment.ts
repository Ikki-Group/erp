import { gt } from 'drizzle-orm'
import {
	boolean,
	check,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'
import { accountsTable } from './finance'
import { locationsTable } from './location'
import { purchaseInvoicesTable } from './purchasing'
import { salesInvoicesTable } from './sales'

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

/** Canonical enum of payment method *types*, shared by `paymentMethodsTable`
 * (which types are configured/enabled) and `paymentsTable` (which type was
 * used on a given settlement transaction). */
export const paymentMethodEnum = pgEnum('payment_method', [
	'cash',
	'bank_transfer',
	'credit_card',
	'debit_card',
	'e_wallet',
])

export const paymentMethodCategoryEnum = pgEnum('payment_method_category', ['cash', 'cashless'])

/**
 * Payment Methods Table
 *
 * Master data for payment methods with cash/cashless flags and global availability.
 * A payment method can be "global" (automatically available to all store locations)
 * or "location-specific" (mapped explicitly to certain stores via `locationPaymentMethodsTable`).
 */
export const paymentMethodsTable = pgTable(
	'payment_methods',
	{
		...pk,
		type: paymentMethodEnum('type').notNull(),

		/** Cash vs cashless flag */
		category: paymentMethodCategoryEnum('category').notNull(),

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

export const paymentTypeEnum = pgEnum('payment_type', ['payable', 'receivable'])

/**
 * Payments Table (Header)
 *
 * Tracks all payment transactions (both incoming collections and outgoing
 * disbursements) — i.e. AR/AP *settlement*. Distinct from `paymentMethodsTable`
 * (which payment method *types* exist) and `locationPaymentMethodsTable`
 * (which are enabled per store) — this table is the actual money movement.
 *
 * Owned by `modules/payment/payment` — NOT `modules/finance` (this used to
 * live in a `finance_payment.ts` file, which was a mis-grouping).
 */
export const paymentsTable = pgTable(
	'payments',
	{
		...pk,
		type: paymentTypeEnum('type').notNull(),
		date: timestamp('date', { mode: 'date', withTimezone: true }).notNull().defaultNow(),

		/** Reference: Bank Transfer No, Cheque No, etc. */
		referenceNo: text('reference_no'),

		/** Account: The Bank or Cash account involved */
		accountId: integer('account_id')
			.notNull()
			.references(() => accountsTable.id, { onDelete: 'restrict' }),

		method: paymentMethodEnum('method').notNull(),

		/** Total amount paid in this transaction */
		amount: numeric('amount', { precision: 18, scale: 2 }).notNull().default('0'),

		notes: text('notes'),
		...auditBasicColumns,
	},
	(t) => [
		index('payments_date_idx').on(t.date),
		index('payments_account_idx').on(t.accountId),
		index('payments_type_idx').on(t.type),

		// Amount must be positive
		check('payments_amount_pos_chk', gt(t.amount, 0)),
	],
)

/**
 * Payment Invoices Table (Lines/Allocation)
 *
 * Join table to allocate a single payment to one or more invoices.
 */
export const paymentInvoicesTable = pgTable(
	'payment_invoices',
	{
		...pk,
		paymentId: integer('payment_id')
			.notNull()
			.references(() => paymentsTable.id, { onDelete: 'cascade' }),

		/** Optional: Link to Sales Invoice (Receivable) */
		salesInvoiceId: integer('sales_invoice_id').references(() => salesInvoicesTable.id, {
			onDelete: 'cascade',
		}),

		/** Optional: Link to Purchase Invoice (Payable) */
		purchaseInvoiceId: integer('purchase_invoice_id').references(() => purchaseInvoicesTable.id, {
			onDelete: 'cascade',
		}),

		/** Amount allocated to this specific invoice */
		amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),

		...auditBasicColumns,
	},
	(t) => [
		index('payment_invoices_payment_idx').on(t.paymentId),
		index('payment_invoices_sales_inv_idx').on(t.salesInvoiceId),
		index('payment_invoices_purchase_inv_idx').on(t.purchaseInvoiceId),

		// Amount must be positive
		check('payment_invoices_amount_pos_chk', gt(t.amount, 0)),
	],
)
