import { record } from '@elysiajs/opentelemetry'
import { and, eq } from 'drizzle-orm'

import { mokaSyncCursorsTable } from '@/db/schema'

import { takeFirst, type DbContext, type DbClient } from '@/infra/database'
import { stampCreate, stampUpdate } from '@/shared/audit/stamp'

import type { MokaProvider, MokaScrapType } from '../shared.contract'

export interface IMokaSyncCursorRepo {
	readonly db: DbContext
	getCursor(mokaConfigurationId: number, type: MokaScrapType, db?: DbContext): Promise<typeof mokaSyncCursorsTable.$inferSelect | undefined>
	upsertCursor(data: {
		mokaConfigurationId: number
		type: MokaScrapType
		provider?: MokaProvider
		cursorDate?: Date | null
		cursorToken?: string | null
		lastHistoryId?: number | null
	}, actorId: number, db?: DbContext): Promise<void>
}

export class MokaSyncCursorRepo implements IMokaSyncCursorRepo {
	constructor(readonly db: DbClient) {}

	async getCursor(mokaConfigurationId: number, type: MokaScrapType, db: DbContext = this.db) {
		const result = await db
			.select()
			.from(mokaSyncCursorsTable)
			.where(
				and(
					eq(mokaSyncCursorsTable.mokaConfigurationId, mokaConfigurationId),
					eq(mokaSyncCursorsTable.type, type),
				),
			)
		return takeFirst(result)
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
		db: DbContext = this.db,
	): Promise<void> {
		return record('MokaSyncCursorRepo.upsertCursor', async () => {
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
				.then(takeFirst)

			if (!existing) {
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
					cursorDate: data.cursorDate ?? existing.cursorDate,
					cursorToken: data.cursorToken ?? existing.cursorToken,
					lastHistoryId: data.lastHistoryId ?? existing.lastHistoryId,
					...stampUpdate(actorId),
				})
				.where(eq(mokaSyncCursorsTable.id, existing.id))
		})
	}
}
