import { and, eq } from 'drizzle-orm'

import { stampCreate, stampUpdate, takeFirst } from '@/core/database'

import { db } from '@/db'
import { mokaSyncCursorsTable } from '@/db/schema'

import type { MokaProvider, MokaScrapType } from '../dto/moka-scrap-history.dto'

export class MokaSyncCursorService {
	async upsertCursor(
		data: {
			mokaConfigurationId: number
			type: MokaScrapType
			provider?: MokaProvider
			cursorDate?: Date | null
			cursorToken?: string | null
			lastHistoryId?: number | null
		},
		actorId: number,
	): Promise<void> {
		const provider = data.provider ?? 'moka'
		const existing = await db
			.select()
			.from(mokaSyncCursorsTable)
			.where(
				and(
					eq(mokaSyncCursorsTable.mokaConfigurationId, data.mokaConfigurationId),
					eq(mokaSyncCursorsTable.type, data.type),
				),
			)
		const first = takeFirst(existing)

		if (!first) {
			await db.insert(mokaSyncCursorsTable).values({
				mokaConfigurationId: data.mokaConfigurationId,
				type: data.type,
				provider,
				cursorDate: data.cursorDate ?? null,
				cursorToken: data.cursorToken ?? null,
				lastHistoryId: data.lastHistoryId ?? null,
				...stampCreate(actorId),
			})
			return
		}

		await db
			.update(mokaSyncCursorsTable)
			.set({
				provider,
				cursorDate: data.cursorDate ?? first.cursorDate,
				cursorToken: data.cursorToken ?? first.cursorToken,
				lastHistoryId: data.lastHistoryId ?? first.lastHistoryId,
				...stampUpdate(actorId),
			})
			.where(eq(mokaSyncCursorsTable.id, first.id))
	}
}
