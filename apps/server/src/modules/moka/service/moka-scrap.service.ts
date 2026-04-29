import type { MokaConfigurationDto } from '../dto/moka-configuration.dto'
import type { MokaTriggerInputDto } from '../dto/moka.dto'
import { MokaAuthEngine } from './engine/moka-auth.service'
import { MokaCategoryEngine } from './engine/moka-category.service'
import { MokaProductEngine } from './engine/moka-product.service'
import { MokaSalesEngine } from './engine/moka-sales.service'
import type { MokaConfigurationService } from './moka-configuration.service'
import type { MokaScrapHistoryService } from './moka-scrap-history.service'
import type { MokaSyncCursorService } from './moka-sync-cursor.service'
import type { MokaTransformationService } from './moka-transformation.service'
import type { Logger } from 'pino'

export class MokaScrapService {
	constructor(
		private readonly configSvc: MokaConfigurationService,
		private readonly historySvc: MokaScrapHistoryService,
		private readonly cursorSvc: MokaSyncCursorService,
		private readonly transformSvc: MokaTransformationService,
		private readonly logger: Logger,
	) {}

	async handleTrigger(input: MokaTriggerInputDto, actorId: number) {
		const config = await this.configSvc.findByLocationId(input.locationId)
		if (!config) throw new Error('Moka configuration not found for this location')

		const dateFrom = input.dateFrom ?? new Date()
		const dateTo = input.dateTo ?? new Date()

		const { id: historyId } = await this.historySvc.create(
			{
				mokaConfigurationId: config.id,
				provider: config.provider,
				type: input.type,
				triggerMode: input.triggerMode,
				dateFrom,
				dateTo,
				status: 'processing',
			},
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
				await this.historySvc.updateStatus(historyId, 'completed', {
					recordsCount: categories.length,
					metadata: { count: categories.length },
				})
			} else if (input.type === 'product') {
				const engine = new MokaProductEngine(auth, this.logger)
				const products = await engine.fetch()
				await this.transformSvc.transformProducts(config.locationId, products, actorId)
				await this.historySvc.updateStatus(historyId, 'completed', {
					recordsCount: products.length,
					metadata: { count: products.length },
				})
			} else if (input.type === 'sales') {
				const engine = new MokaSalesEngine(auth, this.logger, {
					from: input.dateFrom ?? new Date(),
					to: input.dateTo ?? new Date(),
				})
				const sales = await engine.fetch()
				await this.transformSvc.transformSales(config.locationId, sales, actorId)
				await this.historySvc.updateStatus(historyId, 'completed', {
					recordsCount: sales.length,
					metadata: { count: sales.length },
				})
			}

			await this.configSvc.updateSyncCheckpoint(config.id, input.type)
			await this.cursorSvc.upsertCursor(
				{
					mokaConfigurationId: config.id,
					type: input.type,
					provider: config.provider,
					cursorDate: dateTo,
					lastHistoryId: historyId,
				},
				actorId,
			)
		} catch (error: any) {
			await this.historySvc.updateStatus(historyId, 'failed', {
				errorMessage: error instanceof Error ? error.message : String(error),
			})
			throw error
		}
	}
}
