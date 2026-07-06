import { logger } from '@/infra/logger'

import type { MokaConfigurationService } from '../configuration/configuration.service'
import type { MokaScrapHistoryService } from './scrap-history/scrap-history.service'
import type { MokaSyncCursorService } from './scrap-sync-cursor/scrap-sync-cursor.service'
import type { MokaTransformationService } from './scrap-transformation.service'
import { MokaScrapService } from './scrap.service'

export type MokaScrapModule = MokaScrapService

export interface MokaScrapModuleDeps {
	configuration: MokaConfigurationService
	history: MokaScrapHistoryService
	cursor: MokaSyncCursorService
	transformation: MokaTransformationService
}

export function createMokaScrapModule(deps: MokaScrapModuleDeps): MokaScrapModule {
	return new MokaScrapService(
		deps.configuration,
		deps.history,
		deps.cursor,
		deps.transformation,
		logger,
	)
}
