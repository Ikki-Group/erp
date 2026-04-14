import { record } from '@elysiajs/opentelemetry'
import { db } from '@/db'
import { journalEntriesTable, journalItemsTable } from '@/db/schema/finance'
import { stampCreate } from '@/core/database'
import { and, eq, isNull } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'

export interface JournalItemInput {
	accountId: number
	debit: string
	credit: string
}

export type JournalEntry = InferSelectModel<typeof journalEntriesTable>
export type JournalItem = InferSelectModel<typeof journalItemsTable>

export interface JournalEntryWithItems extends JournalEntry {
	items: JournalItem[]
}

export interface JournalEntryInput {
	date: Date
	reference: string
	sourceType: string
	sourceId: number
	note?: string | null
	items: JournalItemInput[]
}

export class GeneralLedgerService {
	async postEntry(input: JournalEntryInput, actorId: number) {
		return record('GeneralLedgerService.postEntry', async () => {
			// 1. Validation: Ensure debit and credit are balanced
			const totalDebit = input.items.reduce((sum, item) => sum + Number(item.debit), 0)
			const totalCredit = input.items.reduce((sum, item) => sum + Number(item.credit), 0)

			if (Math.abs(totalDebit - totalCredit) > 0.01) {
				throw new Error(
					`Journal entry must be balanced. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`,
				)
			}

			return db.transaction(async (tx) => {
				const metadata = stampCreate(actorId)

				// 2. Create Journal Entry
				const [entry] = await tx
					.insert(journalEntriesTable)
					.values({
						date: input.date,
						reference: input.reference,
						sourceType: input.sourceType,
						sourceId: input.sourceId,
						note: input.note ?? null,
						...metadata,
					})
					.returning()

				if (!entry) throw new Error('Failed to create journal entry')

				// 3. Create Journal Items
				for (const item of input.items) {
					await tx.insert(journalItemsTable).values({
						journalEntryId: entry.id,
						accountId: item.accountId,
						debit: item.debit,
						credit: item.credit,
						...metadata,
					})
				}

				return entry
			})
		})
	}

	async getEntryBySource(
		sourceType: string,
		sourceId: number,
	): Promise<JournalEntryWithItems | null> {
		const [entry] = await db
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

		if (!entry) return null

		const items = await db
			.select()
			.from(journalItemsTable)
			.where(eq(journalItemsTable.journalEntryId, entry.id))

		return { ...entry, items }
	}
}
