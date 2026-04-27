import { and, desc, eq, isNull } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { NotFoundError } from '@/core/http/errors'
import { res } from '@/core/http/response'

import { db } from '@/db'
import { journalEntriesTable, journalItemsTable } from '@/db/schema/finance'

import type { GeneralLedgerService } from '../service/general-ledger.service'

export function initJournalRoute(_s: GeneralLedgerService) {
	return new Elysia({ detail: { tags: ['Finance'] } })
		.use(authPluginMacro)
		.get(
			'/entries',
			async () => {
				const rows = await db
					.select()
					.from(journalEntriesTable)
					.where(isNull(journalEntriesTable.deletedAt))
					.orderBy(desc(journalEntriesTable.date))

				// Manual join/mapping since db.query is not used in this project
				const items = await db.select().from(journalItemsTable)
				const result = rows.map((r) => ({
					...r,
					items: items.filter((i) => i.journalEntryId === r.id),
				}))

				return res.ok(result)
			},
			{ auth: true },
		)
		.get(
			'/entries/:id',
			async ({ params: { id } }) => {
				const [entry] = await db
					.select()
					.from(journalEntriesTable)
					.where(and(eq(journalEntriesTable.id, id), isNull(journalEntriesTable.deletedAt)))

				if (!entry) throw new NotFoundError('Journal entry not found', 'JOURNAL_ENTRY_NOT_FOUND')

				const items = await db
					.select()
					.from(journalItemsTable)
					.where(eq(journalItemsTable.journalEntryId, id))

				return res.ok({ ...entry, items })
			},
			{ params: t.Object({ id: t.Numeric() }), auth: true },
		)
}
