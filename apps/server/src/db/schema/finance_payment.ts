import { index, integer, numeric, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

import { paymentMethodEnum, paymentTypeEnum } from './_helpers'
import { accountsTable } from './finance'
import { purchaseInvoicesTable } from './purchasing'
import { salesInvoicesTable } from './sales'

/**
 * Payments Table (Header)
 *
 * Tracks all payment transactions (both incoming collections and outgoing disbursements).
 */
export const paymentsTable = pgTable(
	'payments',
	{
		...pk,
		type: paymentTypeEnum().notNull(),
		date: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),

		/** Reference: Bank Transfer No, Cheque No, etc. */
		referenceNo: text('reference_no'),

		/** Account: The Bank or Cash account involved */
		accountId: integer('account_id')
			.notNull()
			.references(() => accountsTable.id, { onDelete: 'restrict' }),

		method: paymentMethodEnum().notNull(),

		/** Total amount paid in this transaction */
		amount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		notes: text(),
		...auditColumns,
	},
	(t) => [
		index('payments_date_idx').on(t.date),
		index('payments_account_idx').on(t.accountId),
		index('payments_type_idx').on(t.type),
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
		paymentId: integer()
			.notNull()
			.references(() => paymentsTable.id, { onDelete: 'cascade' }),

		/** Optional: Link to Sales Invoice (Receivable) */
		salesInvoiceId: integer().references(() => salesInvoicesTable.id, { onDelete: 'cascade' }),

		/** Optional: Link to Purchase Invoice (Payable) */
		purchaseInvoiceId: integer().references(() => purchaseInvoicesTable.id, {
			onDelete: 'cascade',
		}),

		/** Amount allocated to this specific invoice */
		amount: numeric({ precision: 18, scale: 2 }).notNull(),

		...auditColumns,
	},
	(t) => [
		index('payment_invoices_payment_idx').on(t.paymentId),
		index('payment_invoices_sales_inv_idx').on(t.salesInvoiceId),
		index('payment_invoices_purchase_inv_idx').on(t.purchaseInvoiceId),
	],
)
