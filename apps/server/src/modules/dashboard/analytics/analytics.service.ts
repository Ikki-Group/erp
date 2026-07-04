import { record } from '@elysiajs/opentelemetry'

import { CacheService, type CacheClient } from '@/infra/cache'

import type { PnLData, TopSalesItem } from './analytics.contract'
import type { IAnalyticsRepo } from './analytics.repo'

export class AnalyticsService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: IAnalyticsRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'analytics')
	}

	async getPnL(startDate: Date, endDate: Date): Promise<PnLData> {
		return this.cache.getOrSet({
			key: `pnl.${startDate.toISOString()}.${endDate.toISOString()}`,
			ttl: '1h',
			factory: async () => {
				return record('AnalyticsService.getPnL', async () => this.repo.findPnLData(startDate, endDate))
			},
		})
	}

	async getTopSales(startDate: Date, endDate: Date, limit: number = 5): Promise<TopSalesItem[]> {
		return this.cache.getOrSet({
			key: `top_sales.${startDate.toISOString()}.${endDate.toISOString()}.${limit}`,
			ttl: '30m',
			factory: async () => {
				return record('AnalyticsService.getTopSales', async () => this.repo.findTopSales(startDate, endDate, limit))
			},
		})
	}

	async handleGetPnL(startDate: Date, endDate: Date): Promise<PnLData> {
		return record('AnalyticsService.handleGetPnL', async () => this.getPnL(startDate, endDate))
	}

	async handleGetTopSales(startDate: Date, endDate: Date, limit: number): Promise<TopSalesItem[]> {
		return record('AnalyticsService.handleGetTopSales', async () => this.getTopSales(startDate, endDate, limit))
	}
}
