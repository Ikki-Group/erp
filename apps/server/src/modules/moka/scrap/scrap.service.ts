import type { MokaConfigurationDto } from '../configuration/configuration.dto'
import type { MokaConfigurationService } from '../configuration/configuration.service'
import { MokaAuthEngine } from '../engine/moka-auth.service'
import { MokaCategoryEngine } from '../engine/moka-category.service'
import { MokaProductEngine } from '../engine/moka-product.service'
import { MokaSalesEngine } from '../engine/moka-sales.service'
import type { MokaScrapHistoryService } from './scrap-history.service'
import type { MokaSyncCursorService } from './scrap-sync-cursor.service'
import type { MokaTransformationService } from './scrap-transformation.service'
import type { MokaTriggerInputDto } from './scrap.dto'
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
				businessId: null,
				outletId: auth.mokaOutletId,
				accessToken: auth.token,
			})

			const outletId = config.outletId

			if (input.type === 'category') {
				const engine = new MokaCategoryEngine(auth, this.logger)
				const categories = await engine.fetch()
				const outletNum = outletId ? Number(outletId) : null
				const filtered = outletNum
					? categories.filter((c) => c.outlet_id === outletNum)
					: categories
				await this.transformSvc.transformCategories(config.locationId, filtered, actorId, outletId)
				await this.historySvc.updateStatus(historyId, 'completed', {
					recordsCount: filtered.length,
					metadata: {
						fetched: categories.length,
						synced: filtered.length,
						filteredByOutlet: outletNum ? categories.length - filtered.length : 0,
						rawData: categories, // Store raw API response for audit/re-processing
					},
				})
			} else if (input.type === 'product') {
				const engine = new MokaProductEngine(auth, this.logger)
				const products = await engine.fetch()
				const outletNum = outletId ? Number(outletId) : null
				const filtered = outletNum ? products.filter((p) => p.outlet_id === outletId) : products
				await this.transformSvc.transformProducts(config.locationId, filtered, actorId, outletId)
				await this.historySvc.updateStatus(historyId, 'completed', {
					recordsCount: filtered.length,
					metadata: {
						fetched: products.length,
						synced: filtered.length,
						filteredByOutlet: outletNum ? products.length - filtered.length : 0,
						rawData: products, // Store raw API response for audit/re-processing
					},
				})
			} else if (input.type === 'sales') {
				// Use cursor date for incremental sync if available
				const cursor = await this.cursorSvc.getCursor(config.id, input.type)
				const engine = new MokaSalesEngine(
					auth,
					this.logger,
					{ from: input.dateFrom ?? new Date(), to: input.dateTo ?? new Date() },
					cursor?.cursorDate ?? null,
				)
				const sales = await engine.fetch()
				const outletNum = outletId ? Number(outletId) : null
				const filtered = outletNum ? sales.filter((s) => s.outlet_id === outletNum) : sales

				// Pre-sync stats for audit metadata
				const splitPaymentOrders = filtered.filter((s) => s.split_payment_details?.length).length
				const voidItemCount = filtered.reduce((sum, s) => sum + (s.void_items?.length ?? 0), 0)
				const totalItems = filtered.reduce((sum, s) => sum + (s.items?.length ?? 0), 0)

				await this.transformSvc.transformSales(config.locationId, filtered, actorId, outletId)
				await this.historySvc.updateStatus(historyId, 'completed', {
					recordsCount: filtered.length,
					metadata: {
						fetched: sales.length,
						synced: filtered.length,
						filteredByOutlet: outletNum ? sales.length - filtered.length : 0,
						totalItems,
						voidItems: voidItemCount,
						splitPaymentOrders,
						dateRange: { from: input.dateFrom, to: input.dateTo },
					},
				})
			}

			await this.configSvc.updateSyncCheckpoint(config.id, input.type)
			await this.cursorSvc.upsertCursor(
				{
					mokaConfigurationId: config.id,
					type: input.type,
					provider: config.provider,
					cursorDate: input.dateTo ?? new Date(),
					lastHistoryId: historyId,
				},
				actorId,
			)
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : String(error)
			await this.historySvc.updateStatus(historyId, 'failed', {
				errorMessage: msg,
			})
			throw error
		}
	}
}
