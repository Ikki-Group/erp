import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { StockAlertCountFilterDto, StockAlertFilterDto } from './stock-alert.contract'
import type { IStockAlertRepo } from './stock-alert.repo'

export class StockAlertService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IStockAlertRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory.alert')
	}

	async handleAlerts(filter: StockAlertFilterDto) {
		return record('StockAlertService.handleAlerts', async () => {
			const key = `alerts.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.findAlertsPage(filter),
			})
		})
	}

	async handleCount(filter: StockAlertCountFilterDto) {
		return record('StockAlertService.handleCount', async () => {
			const key = `count.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.findAlertCount(filter),
			})
		})
	}
}
