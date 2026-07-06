import { Elysia } from 'elysia'

import type { CacheClient } from '@/infra/cache'
import type { DbClient } from '@/infra/database'

import type { FinanceModule } from '@/modules/finance'

import { initMokaConfigurationRoute } from './configuration/configuration.route'
import { createMokaConfigurationModule } from './configuration'
import { createMokaScrapHistoryModule } from './scrap/scrap-history'
import { createMokaSyncCursorModule } from './scrap/scrap-sync-cursor'
import { initMokaScrapRoute } from './scrap/scrap.route'
import { createMokaScrapModule, createMokaTransformationModule } from './scrap'

import type { MokaConfigurationService } from './configuration/configuration.service'
import type { MokaScrapHistoryService } from './scrap/scrap-history/scrap-history.service'
import type { MokaSyncCursorService } from './scrap/scrap-sync-cursor/scrap-sync-cursor.service'
import type { MokaScrapService } from './scrap/scrap.service'

export interface MokaServiceModule {
	configuration: MokaConfigurationService
	history: MokaScrapHistoryService
	cursor: MokaSyncCursorService
	transformation: ReturnType<typeof createMokaTransformationModule>
	scrap: MokaScrapService
}

export function createMokaServiceModule(
	db: DbClient,
	cacheClient: CacheClient,
	deps: FinanceModule,
): MokaServiceModule {
	const configuration = createMokaConfigurationModule(db, cacheClient)
	const history = createMokaScrapHistoryModule(db, cacheClient)
	const cursor = createMokaSyncCursorModule(db, cacheClient)
	const transformation = createMokaTransformationModule(db, {
		account: deps.account,
		journal: deps.journal,
	})
	const scrap = createMokaScrapModule({ configuration, history, cursor, transformation })

	return { configuration, history, cursor, transformation, scrap }
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
export type { MokaSyncCursorService } from './scrap/scrap-sync-cursor/scrap-sync-cursor.service'
export type { MokaScrapService } from './scrap/scrap.service'

// Export repo ports for testing
export type { IMokaConfigurationRepo } from './configuration/configuration.repo'
export type { IMokaScrapHistoryRepo } from './scrap/scrap-history/scrap-history.repo'
export type { IMokaSyncCursorRepo } from './scrap/scrap-sync-cursor/scrap-sync-cursor.repo'
