import { desc, eq } from 'drizzle-orm'

import { stampCreate } from '@/core/database'

import { db } from '@/db'
import { mokaScrapHistoriesTable } from '@/db/schema'

import {
	MokaScrapHistoryDto,
	type MokaProvider,
	type MokaScrapStatus,
	type MokaScrapType,
	type MokaSyncTriggerMode,
} from '../dto/moka-scrap-history.dto'

export class MokaScrapHistoryService {
	async create(
		data: {
			mokaConfigurationId: number
			provider?: MokaProvider
			type: MokaScrapType
			triggerMode?: MokaSyncTriggerMode
			dateFrom: Date
			dateTo: Date
			status?: MokaScrapStatus
		},
		actorId: number,
	): Promise<{ id: number }> {
		const now = new Date()
		const [result] = await db
			.insert(mokaScrapHistoriesTable)
			.values({
				...data,
				provider: data.provider ?? 'moka',
				triggerMode: data.triggerMode ?? 'manual',
				startedAt: data.status === 'processing' ? now : null,
				...stampCreate(actorId),
			})
			.returning({ id: mokaScrapHistoriesTable.id })

		if (!result) throw new Error('Failed to create scrap history')
		return result
	}

	async updateStatus(
		id: number,
		status: MokaScrapStatus,
		extra?: { rawPath?: string; errorMessage?: string; metadata?: any; recordsCount?: number },
	) {
		const now = new Date()
		const terminal = status === 'completed' || status === 'failed'
		await db
			.update(mokaScrapHistoriesTable)
			.set({
				status,
				...extra,
				finishedAt: terminal ? now : undefined,
				updatedAt: now,
			})
			.where(eq(mokaScrapHistoriesTable.id, id))
	}

	async handleList(configId?: number) {
		const query = db.select().from(mokaScrapHistoriesTable)

		if (configId) {
			query.where(eq(mokaScrapHistoriesTable.mokaConfigurationId, configId))
		}

		const results = await query.orderBy(desc(mokaScrapHistoriesTable.createdAt)).limit(50)
		return results.map((r) => MokaScrapHistoryDto.parse(r))
	}
}
