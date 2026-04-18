import { isNull } from 'drizzle-orm'
import {
	boolean,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	index,
	type AnyPgColumn,
} from 'drizzle-orm/pg-core'

import { auditColumns, pk } from '@/core/database/schema'
import { suppliersTable } from './supplier'
import { locationsTable } from './location'

export const accountTypeEnum = pgEnum('account_type', [
	'ASSET',
	'LIABILITY',
	'EQUITY',
	'REVENUE',
	'EXPENSE',
])

export const expenditureTypeEnum = pgEnum('expenditure_type', ['BILLS', 'ASSET', 'PURCHASES'])
export const expenditureStatusEnum = pgEnum('expenditure_status', [
	'PENDING',
	'PAID',
	'VOID',
	'REFUNDED',
])

export const accountsTable = pgTable(
	'accounts',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		type: accountTypeEnum('type').notNull(),
		isGroup: boolean('is_group').default(false).notNull(),
		parentId: integer('parent_id').references((): AnyPgColumn => accountsTable.id, {
			onDelete: 'restrict',
		}),
		...auditColumns,
	},
	(t) => [uniqueIndex('accounts_code_idx').on(t.code).where(isNull(t.deletedAt))],
)

export const journalEntriesTable = pgTable(
	'journal_entries',
	{
		...pk,
		date: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
		reference: text('reference').notNull(),
		sourceType: text('source_type').notNull(), // 'sales', 'payroll', 'purchasing', 'production'
		sourceId: integer('source_id').notNull(),
		note: text('note'),
		...auditColumns,
	},
	(t) => [
		index('journal_entries_date_idx').on(t.date),
		index('journal_entries_source_idx').on(t.sourceType, t.sourceId),
	],
)

export const journalItemsTable = pgTable(
	'journal_items',
	{
		...pk,
		journalEntryId: integer('journal_entry_id')
			.notNull()
			.references(() => journalEntriesTable.id, { onDelete: 'cascade' }),
		accountId: integer('account_id')
			.notNull()
			.references(() => accountsTable.id),
		debit: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		credit: numeric({ precision: 18, scale: 2 }).notNull().default('0'),
		...auditColumns,
	},
	(t) => [
		index('journal_items_entry_idx').on(t.journalEntryId),
		index('journal_items_account_idx').on(t.accountId),
	],
)

export const expendituresTable = pgTable(
	'expenditures',
	{
		...pk,
		type: expenditureTypeEnum('type').notNull(),
		status: expenditureStatusEnum('status').notNull().default('PAID'),
		title: text('title').notNull(),
		description: text('description'),
		date: timestamp({ mode: 'date', withTimezone: true }).notNull().defaultNow(),
		amount: numeric({ precision: 18, scale: 2 }).notNull().default('0'),

		// Source: Where the money comes from (Cash/Bank)
		sourceAccountId: integer('source_account_id')
			.notNull()
			.references(() => accountsTable.id),

		// Category: Where the money goes (Asset or Expense)
		targetAccountId: integer('target_account_id')
			.notNull()
			.references(() => accountsTable.id),

		// Liability: For tracking debt (Hutang)
		liabilityAccountId: integer('liability_account_id').references(() => accountsTable.id),

		supplierId: integer('supplier_id').references(() => suppliersTable.id),
		locationId: integer('location_id')
			.notNull()
			.references(() => locationsTable.id),

		isInstallment: boolean('is_installment').notNull().default(false),
		...auditColumns,
	},
	(t) => [
		index('expenditures_date_idx').on(t.date),
		index('expenditures_location_idx').on(t.locationId),
		index('expenditures_type_idx').on(t.type),
	],
)
