import { record } from '@elysiajs/opentelemetry'
import { and, eq } from 'drizzle-orm'

import type { CacheClient } from '@/core/cache'
import { stampCreate, stampUpdate, takeFirst, type DbClient } from '@/core/database'

import { mokaSyncCursorsTable } from '@/db/schema'

import type { MokaProvider, MokaScrapType } from '../shared.dto'

export class MokaSyncCursorRepo {
	private readonly db: DbClient

	constructor(db: DbClient, _cacheClient: CacheClient) {
		this.db = db
	}

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
		return record('MokaSyncCursorRepo.upsertCursor', async () => {
			const provider = data.provider ?? 'moka'
			const existing = await this.db
				.select()
				.from(mokaSyncCursorsTable)
				.where(
					and(
						eq(mokaSyncCursorsTable.mokaConfigurationId, data.mokaConfigurationId),
						eq(mokaSyncCursorsTable.type, data.type),
					),
				)
				.then(takeFirst)

			if (!existing) {
				await this.db.insert(mokaSyncCursorsTable).values({
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

			await this.db
				.update(mokaSyncCursorsTable)
				.set({
					provider,
					cursorDate: data.cursorDate ?? existing.cursorDate,
					cursorToken: data.cursorToken ?? existing.cursorToken,
					lastHistoryId: data.lastHistoryId ?? existing.lastHistoryId,
					...stampUpdate(actorId),
				})
				.where(eq(mokaSyncCursorsTable.id, existing.id))
		})
	}
}
