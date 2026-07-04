import { record } from '@elysiajs/opentelemetry'
import { desc, eq } from 'drizzle-orm'

import { mokaScrapHistoriesTable } from '@/db/schema'

import { type DbContext, type DbClient } from '@/infra/database'
import { stampCreate } from '@/shared/audit/stamp'
import type { EntityRef } from '@/shared/types/utils'

import type {
	MokaProvider,
	MokaScrapStatus,
	MokaScrapType,
	MokaSyncTriggerMode,
} from '../shared.contract'
import * as dto from './scrap-history.contract'

export interface IMokaScrapHistoryRepo {
	readonly db: DbContext
	listByConfigId(configId?: number, db?: DbContext): Promise<dto.MokaScrapHistoryDto[]>
	create(data: {
		mokaConfigurationId: number
		provider?: MokaProvider
		type: MokaScrapType
		triggerMode?: MokaSyncTriggerMode
		dateFrom: Date
		dateTo: Date
		status?: MokaScrapStatus
	}, actorId: number, db?: DbContext): Promise<EntityRef | undefined>
	updateStatus(id: number, status: MokaScrapStatus, extra?: { rawPath?: string; errorMessage?: string; metadata?: any; recordsCount?: number }, db?: DbContext): Promise<void>
}

export class MokaScrapHistoryRepo implements IMokaScrapHistoryRepo {
	constructor(readonly db: DbClient) {}

	/* ---------------------------------- QUERY --------------------------------- */

	async listByConfigId(configId?: number, db: DbContext = this.db): Promise<dto.MokaScrapHistoryDto[]> {
		return record('MokaScrapHistoryRepo.listByConfigId', async () => {
			const where = configId ? eq(mokaScrapHistoriesTable.mokaConfigurationId, configId) : undefined

			const rows = await db
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
		db: DbContext = this.db,
	): Promise<EntityRef | undefined> {
		return record('MokaScrapHistoryRepo.create', async () => {
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

			return result
		})
	}

	async updateStatus(
		id: number,
		status: MokaScrapStatus,
		extra?: { rawPath?: string; errorMessage?: string; metadata?: any; recordsCount?: number },
		db: DbContext = this.db,
	): Promise<void> {
		return record('MokaScrapHistoryRepo.updateStatus', async () => {
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
		})
	}
}
