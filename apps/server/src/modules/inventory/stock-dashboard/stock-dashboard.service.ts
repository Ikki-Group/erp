import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { DashboardKpiFilterDto, DashboardKpiSelectDto } from './stock-dashboard.contract'
import type { IStockDashboardRepo } from './stock-dashboard.repo'

export class StockDashboardService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IStockDashboardRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'inventory.dashboard')
	}

	/* --------------------------------- HANDLER -------------------------------- */

	async handleKpi(filter: DashboardKpiFilterDto): Promise<DashboardKpiSelectDto> {
		return record('StockDashboardService.handleKpi', async () => {
			const key = `kpi.${JSON.stringify(filter)}`
			return this.cache.getOrSet({
				key,
				factory: () => this.repo.getKpi(filter),
			})
		})
	}
}
