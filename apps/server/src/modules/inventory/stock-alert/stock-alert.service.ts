import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { StockAlertFilterDto, StockAlertCountFilterDto } from './stock-alert.contract'
import { StockAlertRepo } from './stock-alert.repo'

export class StockAlertService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: StockAlertRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory.alert')
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleAlerts(filter: StockAlertFilterDto) {
		return record('StockAlertService.handleAlerts', async () => {
			const key = `alerts.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getAlerts(filter),
			})
		})
	}

	async handleCount(filter: StockAlertCountFilterDto) {
		return record('StockAlertService.handleCount', async () => {
			const key = `count.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getAlertCount(filter),
			})
		})
	}
}
