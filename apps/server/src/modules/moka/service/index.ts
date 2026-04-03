import type { Logger } from 'pino'

import type { FinanceServiceModule } from '../../finance/service'
import { MokaConfigurationService } from './moka-configuration.service'
import { MokaScrapHistoryService } from './moka-scrap-history.service'
import { MokaScrapService } from './moka-scrap.service'
import { MokaTransformationService } from './moka-transformation.service'

export class MokaServiceModule {
  public readonly configuration: MokaConfigurationService
  public readonly history: MokaScrapHistoryService
  public readonly transformation: MokaTransformationService
  public readonly scrap: MokaScrapService

  constructor(logger: Logger, finance: FinanceServiceModule) {
    this.configuration = new MokaConfigurationService()
    this.history = new MokaScrapHistoryService()
    this.transformation = new MokaTransformationService(finance.account, finance.journal)
    this.scrap = new MokaScrapService(this.configuration, this.history, this.transformation, logger)
  }
}
