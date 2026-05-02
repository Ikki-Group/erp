import { isNull } from 'drizzle-orm'
import { pgEnum, pgTable, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'

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
		dateOfBirth: timestamp('date_of_birth'),
		/** Customer loyalty tier */
		tier: customerTierEnum('tier').default('bronze'),
		/** Current loyalty points balance */
		pointsBalance: integer('points_balance').default(0).notNull(),
		/** Total lifetime points earned */
		totalPointsEarned: integer('total_points_earned').default(0).notNull(),
		/** Registration date */
		registeredAt: timestamp('registered_at').defaultNow(),
		/** Last visit date */
		lastVisitAt: timestamp('last_visit_at'),
		...auditColumns,
	},
	(t) => [
		uniqueIndex('customers_code_idx').on(t.code).where(isNull(t.deletedAt)),
		uniqueIndex('customers_name_idx').on(t.name).where(isNull(t.deletedAt)),
	],
)

/**
 * Customer Loyalty Transactions Table
 *
 * Tracks all point transactions for audit and history.
 */
export const customerLoyaltyTransactionsTable = pgTable('customer_loyalty_transactions', {
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
	...auditColumns,
})
