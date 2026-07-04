import { and, eq, isNull } from 'drizzle-orm'

import { journalEntriesTable, journalItemsTable } from '@/db/schema/finance'
import { takeFirst, type DbContext } from '@/infra/database'
import type { EntityRef } from '@/shared/types/utils'

import type {
	JournalEntryDto,
	JournalEntryFilterDto,
	JournalEntryWithItemsDto,
} from './general-ledger.contract'

type JournalEntryInsert = typeof journalEntriesTable.$inferInsert
type JournalItemInsert = typeof journalItemsTable.$inferInsert

export interface IGeneralLedgerRepo {
	readonly db: DbContext
	findBySource(
		sourceType: string,
		sourceId: number,
		db?: DbContext,
	): Promise<JournalEntryWithItemsDto | undefined>
	findMany(filter?: JournalEntryFilterDto, db?: DbContext): Promise<JournalEntryDto[]>
	insert(
		data: JournalEntryInsert,
		items: JournalItemInsert[],
		db?: DbContext,
	): Promise<EntityRef | undefined>
}

export class GeneralLedgerRepo implements IGeneralLedgerRepo {
	constructor(readonly db: DbContext) {}

	async findBySource(
		sourceType: string,
		sourceId: number,
		db: DbContext = this.db,
	): Promise<JournalEntryWithItemsDto | undefined> {
		const entry = await db
			.select()
			.from(journalEntriesTable)
			.where(
				and(
					eq(journalEntriesTable.sourceType, sourceType),
					eq(journalEntriesTable.sourceId, sourceId),
					isNull(journalEntriesTable.deletedAt),
				),
			)
			.limit(1)
			.then(takeFirst)

		if (!entry) return undefined

		const items = await db
			.select()
			.from(journalItemsTable)
			.where(eq(journalItemsTable.journalEntryId, entry.id))

		return { ...entry, items }
	}

	async findMany(
		filter?: Partial<Pick<JournalEntryFilterDto, 'sourceType' | 'sourceId'>>,
		db: DbContext = this.db,
	): Promise<JournalEntryDto[]> {
		const where = and(
			filter?.sourceType === undefined
				? undefined
				: eq(journalEntriesTable.sourceType, filter.sourceType),
			filter?.sourceId === undefined
				? undefined
				: eq(journalEntriesTable.sourceId, filter.sourceId),
			isNull(journalEntriesTable.deletedAt),
		)

		return db.select().from(journalEntriesTable).where(where)
	}

	async insert(
		data: JournalEntryInsert,
		items: JournalItemInsert[],
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		const [entry] = await db
			.insert(journalEntriesTable)
			.values(data)
			.returning({ id: journalEntriesTable.id })

		if (!entry) return undefined

		for (const item of items) {
			await db.insert(journalItemsTable).values(item)
		}

		return entry
	}
}

export type JournalEntryInsertType = JournalEntryInsert
export type JournalItemInsertType = JournalItemInsert
