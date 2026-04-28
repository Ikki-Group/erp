import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull } from 'drizzle-orm'

import { type CacheClient, type CacheProvider } from '@/core/cache'
import { stampCreate, type DbClient } from '@/core/database'
import { logger } from '@/core/logger'

import { journalEntriesTable, journalItemsTable } from '@/db/schema/finance'

export type JournalEntry = typeof journalEntriesTable.$inferSelect
export type JournalItem = typeof journalItemsTable.$inferSelect
export type JournalEntryWithItems = JournalEntry & { items: JournalItem[] }

export type JournalEntryInput = {
	date: Date
	reference: string
	sourceType: string
	sourceId: number
	note?: string
	items: JournalItemInput[]
}

export type JournalItemInput = {
	accountId: number
	debit: string
	credit: string
}

const GENERAL_LEDGER_CACHE_NAMESPACE = 'finance.gl'

export class GeneralLedgerRepo {
	private readonly db: DbClient
	private readonly cache: CacheProvider

	constructor(db: DbClient, cacheClient: CacheClient) {
		this.db = db
		this.cache = cacheClient.namespace(GENERAL_LEDGER_CACHE_NAMESPACE)
	}
	/* -------------------------------- INTERNAL -------------------------------- */

	async #clearCache(sourceType?: string, sourceId?: number) {
		const keys = []
		if (sourceType && sourceId) keys.push(`source.${sourceType}.${sourceId}`)
		await this.cache.deleteMany({ keys })
	}

	#clearCacheAsync(sourceType?: string, sourceId?: number): void {
		void this.#clearCache(sourceType, sourceId).catch((error: unknown) => {
			logger.error(error, 'GeneralLedgerRepo cache invalidation failed')
		})
	}

	/* ---------------------------------- QUERY --------------------------------- */

	async getEntryBySource(sourceType: string, sourceId: number) {
		return record('GeneralLedgerRepo.getEntryBySource', async () => {
			return this.cache.getOrSet({
				key: `source.${sourceType}.${sourceId}`,
				factory: async () => {
					const [entry] = await this.db
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

					const items = await this.db
						.select()
						.from(journalItemsTable)
						.where(eq(journalItemsTable.journalEntryId, entry.id))

					return { ...entry, items }
				},
			})
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

	async postEntry(input: JournalEntryInput, actorId: number) {
		return record('GeneralLedgerRepo.postEntry', async () => {
			return this.db.transaction(async (tx) => {
				const metadata = stampCreate(actorId)

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

				for (const item of input.items) {
					await tx.insert(journalItemsTable).values({
						journalEntryId: entry.id,
						accountId: item.accountId,
						debit: item.debit,
						credit: item.credit,
						...metadata,
					})
				}

				this.#clearCacheAsync(input.sourceType, input.sourceId)
				return entry
			})
		})
	}
}
