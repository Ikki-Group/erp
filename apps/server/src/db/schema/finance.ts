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

export const accountTypeEnum = pgEnum('account_type', [
	'ASSET',
	'LIABILITY',
	'EQUITY',
	'REVENUE',
	'EXPENSE',
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
