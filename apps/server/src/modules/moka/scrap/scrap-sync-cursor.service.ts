import { record } from '@elysiajs/opentelemetry'

import type { MokaProvider, MokaScrapType } from '../shared.dto'
import { MokaSyncCursorRepo } from './scrap-sync-cursor.repo'

export class MokaSyncCursorService {
	constructor(private readonly repo: MokaSyncCursorRepo) {}

	async getCursor(mokaConfigurationId: number, type: MokaScrapType) {
		return record('MokaSyncCursorService.getCursor', async () => {
			return this.repo.getCursor(mokaConfigurationId, type)
		})
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
		return record('MokaSyncCursorService.upsertCursor', async () => {
			await this.repo.upsertCursor(data, actorId)
		})
	}
}
