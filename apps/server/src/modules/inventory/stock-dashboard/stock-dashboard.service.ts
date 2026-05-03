import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/lib/cache'

import type { DashboardKpiFilterDto } from './stock-dashboard.dto'
import { StockDashboardRepo } from './stock-dashboard.repo'

export class StockDashboardService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: StockDashboardRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'inventory.dashboard', client: cacheClient })
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleKpi(filter: DashboardKpiFilterDto) {
		return record('StockDashboardService.handleKpi', async () => {
			const key = `kpi.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getKpi(filter),
			})
		})
	}
}
