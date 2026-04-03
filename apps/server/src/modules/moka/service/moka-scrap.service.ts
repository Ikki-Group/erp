/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Logger } from 'pino'

import type { MokaConfigurationDto } from '../dto/moka-configuration.dto'
import type { MokaTriggerInputDto } from '../dto/moka.dto'
import { MokaAuthEngine } from './engine/moka-auth.service'
import { MokaCategoryEngine } from './engine/moka-category.service'
import { MokaProductEngine } from './engine/moka-product.service'
import { MokaSalesEngine } from './engine/moka-sales.service'
import type { MokaConfigurationService } from './moka-configuration.service'
import type { MokaScrapHistoryService } from './moka-scrap-history.service'
import type { MokaTransformationService } from './moka-transformation.service'

export class MokaScrapService {
  constructor(
    private readonly configSvc: MokaConfigurationService,
    private readonly historySvc: MokaScrapHistoryService,
    private readonly transformSvc: MokaTransformationService,
    private readonly logger: Logger,
  ) {}

  async handleTrigger(input: MokaTriggerInputDto, actorId: number) {
    const config = await this.configSvc.findByLocationId(input.locationId)
    if (!config) throw new Error('Moka configuration not found for this location')

    const dateFrom = input.dateFrom || new Date()
    const dateTo = input.dateTo || new Date()

    const { id: historyId } = await this.historySvc.create(
      { mokaConfigurationId: config.id, type: input.type, dateFrom, dateTo, status: 'processing' },
      actorId,
    )

    this.runScrapTask(historyId, config, input, actorId).catch((err: unknown) => {
      this.logger.error({ err, historyId }, 'Failed to run Moka scrap task')
    })

    return { historyId }
  }

  private async runScrapTask(
    historyId: number,
    config: MokaConfigurationDto,
    input: MokaTriggerInputDto,
    actorId: number,
  ) {
    const auth = new MokaAuthEngine(this.logger, { email: config.email, password: config.password })

    try {
      await auth.ensureAuthenticated()

      await this.configSvc.updateAuthData(config.id, {
        businessId: null, // MokaAuthEngine doesn't provide businessId anymore, or we can get it from outlets[0]
        outletId: auth.mokaOutletId,
        accessToken: auth.token,
      })

      if (input.type === 'category') {
        const engine = new MokaCategoryEngine(auth, this.logger)
        const categories = await engine.fetch()
        await this.transformSvc.transformCategories(config.locationId, categories, actorId)
        await this.historySvc.updateStatus(historyId, 'completed', { metadata: { count: categories.length } })
      } else if (input.type === 'product') {
        const engine = new MokaProductEngine(auth, this.logger)
        const products = await engine.fetch()
        await this.transformSvc.transformProducts(config.locationId, products, actorId)
        await this.historySvc.updateStatus(historyId, 'completed', { metadata: { count: products.length } })
      } else if (input.type === 'sales') {
        const engine = new MokaSalesEngine(auth, this.logger, {
          from: input.dateFrom || new Date(),
          to: input.dateTo || new Date(),
        })
        const sales = await engine.fetch()
        // TODO: Transform sales data
        await this.historySvc.updateStatus(historyId, 'completed', { metadata: { count: sales.length } })
      }
    } catch (error: any) {
      await this.historySvc.updateStatus(historyId, 'failed', {
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}
