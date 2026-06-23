import { check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { auditBasicColumns, pk } from './_helpers'

export const customerTierEnum = pgEnum('customer_tier', ['bronze', 'silver', 'gold', 'platinum'])

export const loyaltyTransactionTypeEnum = pgEnum('loyalty_transaction_type', [
	'earned',
	'redeemed',
	'adjusted',
	'expired',
])

/**
 * Customers Table
 *
 * Stores customer data for CRM and Sales including loyalty information.
 */
export const customersTable = pgTable(
	'customers',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		email: text('email'),
		phone: text('phone'),
		address: text('address'),
		/** Citizen ID or Tax ID (NPWP in Indonesia) */
		taxId: text('tax_id'),
		/** Date of birth for birthday promotions */
		dateOfBirth: timestamp('date_of_birth', { mode: 'date', withTimezone: true }),
		/** Customer loyalty tier */
		tier: customerTierEnum('tier').default('bronze'),
		/** Current loyalty points balance */
		pointsBalance: integer('points_balance').default(0).notNull(),
		/** Total lifetime points earned */
		totalPointsEarned: integer('total_points_earned').default(0).notNull(),
		/** Registration date */
		registeredAt: timestamp('registered_at', { mode: 'date', withTimezone: true }).defaultNow(),
		/** Last visit date */
		lastVisitAt: timestamp('last_visit_at', { mode: 'date', withTimezone: true }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('customers_code_idx').on(t.code),
		uniqueIndex('customers_name_idx').on(t.name),

		// Points must be non-negative
		check('customers_points_balance_nonneg_chk', sql`points_balance >= 0`),
		check('customers_total_points_earned_nonneg_chk', sql`total_points_earned >= 0`),
	],
)

/**
 * Customer Loyalty Transactions Table
 *
 * Tracks all point transactions for audit and history.
 */
export const customerLoyaltyTransactionsTable = pgTable(
	'customer_loyalty_transactions',
	{
		...pk,
		customerId: integer('customer_id')
			.notNull()
			.references(() => customersTable.id, { onDelete: 'cascade' }),
		type: loyaltyTransactionTypeEnum('type').notNull(),
		points: integer('points').notNull(),
		/** Running balance after this transaction */
		balanceAfter: integer('balance_after').notNull(),
		/** Reference to the source transaction (e.g., sales_order_id) */
		referenceType: text('reference_type'),
		referenceId: integer('reference_id'),
		description: text('description'),
		...auditBasicColumns,
	},
	(t) => [
		index('customer_loyalty_txn_customer_idx').on(t.customerId),
		index('customer_loyalty_txn_type_idx').on(t.type),

		// Balance after must be non-negative
		check('customer_loyalty_txn_balance_nonneg_chk', sql`balance_after >= 0`),
	],
)
