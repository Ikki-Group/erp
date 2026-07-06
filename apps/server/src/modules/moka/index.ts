import { Elysia } from 'elysia'

import { logger } from '@/infra/logger'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { FinanceModule } from '@/modules/finance'

import { MokaConfigurationRepo } from './configuration/configuration.repo'
import { initMokaConfigurationRoute } from './configuration/configuration.route'
import { MokaConfigurationService } from './configuration/configuration.service'
import { MokaScrapHistoryRepo } from './scrap/scrap-history/scrap-history.repo'
import { MokaScrapHistoryService } from './scrap/scrap-history/scrap-history.service'
import { MokaSyncCursorRepo } from './scrap/scrap-sync-cursor.repo'
import { MokaSyncCursorService } from './scrap/scrap-sync-cursor.service'
import { MokaTransformationService } from './scrap/scrap-transformation.service'
import { initMokaScrapRoute } from './scrap/scrap.route'
import { MokaScrapService } from './scrap/scrap.service'

export class MokaServiceModule {
	public readonly configuration: MokaConfigurationService
	public readonly history: MokaScrapHistoryService
	public readonly cursor: MokaSyncCursorService
	public readonly transformation: MokaTransformationService
	public readonly scrap: MokaScrapService

	constructor(
		private readonly db: DbClient,
		private readonly cacheClient: CacheClient,
		private readonly deps: FinanceModule,
	) {
		const configRepo = new MokaConfigurationRepo(this.db)
		this.configuration = new MokaConfigurationService(configRepo, this.cacheClient)

		const historyRepo = new MokaScrapHistoryRepo(this.db)
		this.history = new MokaScrapHistoryService(historyRepo, this.cacheClient)

		const cursorRepo = new MokaSyncCursorRepo(this.db)
		this.cursor = new MokaSyncCursorService(cursorRepo, this.cacheClient)

		this.transformation = new MokaTransformationService(
			this.db,
			this.deps.account,
			this.deps.journal,
		)

		this.scrap = new MokaScrapService(
			this.configuration,
			this.history,
			this.cursor,
			this.transformation,
			logger,
		)
	}
}

export function initMokaRouteModule(s: MokaServiceModule) {
	return new Elysia({ prefix: '/moka' })
		.use(initMokaConfigurationRoute(s.configuration))
		.use(initMokaScrapRoute(s.scrap, s.history))
}

// Re-export DTOs for cross-module usage
export type {
	MokaConfigurationDto,
	MokaConfigurationOutputDto,
} from './configuration/configuration.contract'
export type { MokaScrapHistoryDto } from './scrap/scrap-history/scrap-history.contract'
export type { MokaTriggerInputDto } from './scrap/scrap.contract'
export type {
	MokaProvider,
	MokaScrapType,
	MokaSyncTriggerMode,
	MokaScrapStatus,
} from './shared.contract'

export type { MokaConfigurationService } from './configuration/configuration.service'
export type { MokaScrapHistoryService } from './scrap/scrap-history/scrap-history.service'
export type { MokaSyncCursorService } from './scrap/scrap-sync-cursor.service'
export type { MokaScrapService } from './scrap/scrap.service'

// Export repo ports for testing
export type { IMokaConfigurationRepo } from './configuration/configuration.repo'
export type { IMokaScrapHistoryRepo } from './scrap/scrap-history/scrap-history.repo'
export type { IMokaSyncCursorRepo } from './scrap/scrap-sync-cursor.repo'
