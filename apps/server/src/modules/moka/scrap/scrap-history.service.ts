import { record } from '@elysiajs/opentelemetry'

import type { MokaProvider, MokaScrapStatus, MokaScrapType, MokaSyncTriggerMode } from '../shared.dto'
import * as dto from './scrap-history.dto'
import { MokaScrapHistoryRepo } from './scrap-history.repo'

export class MokaScrapHistoryService {
	constructor(private readonly repo: MokaScrapHistoryRepo) {}

	/* --------------------------------- PUBLIC --------------------------------- */

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
		return record('MokaScrapHistoryService.create', async () => {
			return this.repo.create(data, actorId)
		})
	}

	async updateStatus(
		id: number,
		status: MokaScrapStatus,
		extra?: { rawPath?: string; errorMessage?: string; metadata?: any; recordsCount?: number },
	): Promise<void> {
		return record('MokaScrapHistoryService.updateStatus', async () => {
			await this.repo.updateStatus(id, status, extra)
		})
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleList(configId?: number): Promise<dto.MokaScrapHistoryDto[]> {
		return record('MokaScrapHistoryService.handleList', async () => {
			return this.repo.listByConfigId(configId)
		})
	}
}
