import type { DbContext } from '@/infra/database'
import type { PnLData, TopSalesItem } from '@/modules/dashboard/analytics/analytics.contract'
import type { IAnalyticsRepo } from '@/modules/dashboard/analytics/analytics.repo'
import { AnalyticsService } from '@/modules/dashboard/analytics/analytics.service'

import { createMockCacheClient } from '../helpers/mock-db'
import { beforeEach, describe, expect, test } from 'bun:test'

const mockDb = {} as unknown as DbContext

class FakeAnalyticsRepo implements IAnalyticsRepo {
	readonly db = mockDb
	private pnlData: PnLData | undefined
	private topSalesData: TopSalesItem[] = []

	setPnLData(data: PnLData): void {
		this.pnlData = data
	}

	setTopSalesData(data: TopSalesItem[]): void {
		this.topSalesData = data
	}

	async findPnLData(): Promise<PnLData> {
		if (!this.pnlData) {
			return {
				revenue: 0,
				cogs: 0,
				operatingExpenses: 0,
				netProfit: 0,
				period: { start: new Date(), end: new Date() },
			}
		}
		return this.pnlData
	}

	async findTopSales(): Promise<TopSalesItem[]> {
		return this.topSalesData
	}
}

function makePnLData(overrides: Partial<PnLData> = {}): PnLData {
	return {
		revenue: 100000,
		cogs: 60000,
		operatingExpenses: 20000,
		netProfit: 20000,
		period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
		...overrides,
	}
}

function makeTopSalesItem(overrides: Partial<TopSalesItem> = {}): TopSalesItem {
	return {
		productId: 1,
		itemName: 'Product A',
		totalQuantity: 100,
		totalRevenue: 50000,
		...overrides,
	}
}

describe('AnalyticsService (unit)', () => {
	let repo: FakeAnalyticsRepo
	let service: AnalyticsService

	beforeEach(() => {
		repo = new FakeAnalyticsRepo()
		service = new AnalyticsService(repo, createMockCacheClient() as never)
	})

	describe('handleGetPnL', () => {
		test('returns PnL data for the given period', async () => {
			repo.setPnLData(makePnLData())
			const start = new Date('2024-01-01')
			const end = new Date('2024-01-31')

			const result = await service.handleGetPnL(start, end)

			expect(result.revenue).toBe(100000)
			expect(result.cogs).toBe(60000)
			expect(result.netProfit).toBe(20000)
		})
	})

	describe('handleGetTopSales', () => {
		test('returns top sales items for the given period', async () => {
			repo.setTopSalesData([
				makeTopSalesItem({ productId: 1, itemName: 'Product A', totalRevenue: 50000 }),
				makeTopSalesItem({ productId: 2, itemName: 'Product B', totalRevenue: 30000 }),
			])

			const start = new Date('2024-01-01')
			const end = new Date('2024-01-31')

			const result = await service.handleGetTopSales(start, end, 5)

			expect(result.length).toBe(2)
			expect(result[0]!.itemName).toBe('Product A')
			expect(result[0]!.totalRevenue).toBe(50000)
		})

		test('respects limit parameter', async () => {
			repo.setTopSalesData([
				makeTopSalesItem({ productId: 1 }),
				makeTopSalesItem({ productId: 2 }),
				makeTopSalesItem({ productId: 3 }),
			])

			const start = new Date('2024-01-01')
			const end = new Date('2024-01-31')

			const result = await service.handleGetTopSales(start, end, 5)

			expect(result.length).toBe(3)
		})
	})
})
