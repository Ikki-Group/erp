import { record } from '@elysiajs/opentelemetry'
import { desc, eq } from 'drizzle-orm'

import { stampCreate, type DbClient } from '@/core/database'

import { mokaScrapHistoriesTable } from '@/db/schema'

import type {
	MokaProvider,
	MokaScrapStatus,
	MokaScrapType,
	MokaSyncTriggerMode,
} from '../shared.dto'
import * as dto from './scrap-history.dto'

export class MokaScrapHistoryRepo {
	constructor(private readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async listByConfigId(configId?: number): Promise<dto.MokaScrapHistoryDto[]> {
		return record('MokaScrapHistoryRepo.listByConfigId', async () => {
			const where = configId ? eq(mokaScrapHistoriesTable.mokaConfigurationId, configId) : undefined

			const rows = await this.db
				.select()
				.from(mokaScrapHistoriesTable)
				.where(where)
				.orderBy(desc(mokaScrapHistoriesTable.createdAt))
				.limit(50)

			return rows.map((r) => dto.MokaScrapHistoryDto.parse(r))
		})
	}

	/* -------------------------------- MUTATION -------------------------------- */

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
		return record('MokaScrapHistoryRepo.create', async () => {
			const now = new Date()
			const [result] = await this.db
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
		})
	}

	async updateStatus(
		id: number,
		status: MokaScrapStatus,
		extra?: { rawPath?: string; errorMessage?: string; metadata?: any; recordsCount?: number },
	) {
		return record('MokaScrapHistoryRepo.updateStatus', async () => {
			const now = new Date()
			const terminal = status === 'completed' || status === 'failed'
			await this.db
				.update(mokaScrapHistoriesTable)
				.set({
					status,
					...extra,
					finishedAt: terminal ? now : undefined,
					updatedAt: now,
				})
				.where(eq(mokaScrapHistoriesTable.id, id))
		})
	}
}
