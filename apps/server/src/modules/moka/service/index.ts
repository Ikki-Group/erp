import type { FinanceServiceModule } from '@/modules/finance'

import { MokaConfigurationService } from './moka-configuration.service'
import { MokaScrapHistoryService } from './moka-scrap-history.service'
import { MokaScrapService } from './moka-scrap.service'
import { MokaSyncCursorService } from './moka-sync-cursor.service'
import { MokaTransformationService } from './moka-transformation.service'
import type { Logger } from 'pino'

export class MokaServiceModule {
	public readonly configuration: MokaConfigurationService
	public readonly history: MokaScrapHistoryService
	public readonly cursor: MokaSyncCursorService
	public readonly transformation: MokaTransformationService
	public readonly scrap: MokaScrapService

	constructor(logger: Logger, finance: FinanceServiceModule) {
		this.configuration = new MokaConfigurationService()
		this.history = new MokaScrapHistoryService()
		this.cursor = new MokaSyncCursorService()
		this.transformation = new MokaTransformationService(finance.account, finance.journal)
		this.scrap = new MokaScrapService(
			this.configuration,
			this.history,
			this.cursor,
			this.transformation,
			logger,
		)
	}
}
