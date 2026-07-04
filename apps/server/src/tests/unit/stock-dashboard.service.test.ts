/**
 * Unit tests for StockDashboardService.
 *
 * These run WITHOUT a database. The service depends on the `IStockDashboardRepo`
 * port, so we pass a typed in-memory fake (no `as any`).
 */

import type { DbContext } from '@/infra/database'

import type { DashboardKpiFilterDto, DashboardKpiSelectDto } from '@/modules/inventory/stock-dashboard/stock-dashboard.contract'
import type { IStockDashboardRepo } from '@/modules/inventory/stock-dashboard/stock-dashboard.repo'
import { StockDashboardService } from '@/modules/inventory/stock-dashboard/stock-dashboard.service'

import { createMockCacheClient } from '../helpers/mock-db'
import { beforeEach, describe, expect, test } from 'bun:test'

/** A `db` stub that always reports "no conflict" for checkConflict queries. */
const noConflictDb = {
	select: () => ({
		from: () => ({
			where: () => ({
				limit: async () => [] as { id: number }[],
			}),
		}),
	}),
} as unknown as DbContext

/** Typed in-memory fake implementing the IStockDashboardRepo port. */
class FakeStockDashboardRepo implements IStockDashboardRepo {
	readonly db = noConflictDb
	private kpiData: DashboardKpiSelectDto = {
		totalStockValue: 0,
		totalActiveSku: 0,
		lowStockCount: 0,
	}

	seedKpi(data: DashboardKpiSelectDto): void {
		this.kpiData = data
	}

	async getKpi(_filter: DashboardKpiFilterDto): Promise<DashboardKpiSelectDto> {
		return this.kpiData
	}
}

function makeKpiData(overrides: Partial<DashboardKpiSelectDto> = {}): DashboardKpiSelectDto {
	return {
		totalStockValue: 100000,
		totalActiveSku: 150,
		lowStockCount: 12,
		...overrides,
	}
}

describe('StockDashboardService (unit)', () => {
	let repo: FakeStockDashboardRepo
	let service: StockDashboardService

	beforeEach(() => {
		repo = new FakeStockDashboardRepo()
		service = new StockDashboardService(repo, createMockCacheClient() as never)
	})

	describe('handleKpi', () => {
		test('returns KPI data from repo', async () => {
			repo.seedKpi(makeKpiData())

			const result = await service.handleKpi({ locationId: undefined })

			expect(result.totalStockValue).toBe(100000)
			expect(result.totalActiveSku).toBe(150)
			expect(result.lowStockCount).toBe(12)
		})

		test('passes filter to repo', async () => {
			repo.seedKpi(makeKpiData({ totalStockValue: 50000 }))

			const result = await service.handleKpi({ locationId: 5 })

			expect(result.totalStockValue).toBe(50000)
		})

		test('returns zero values when no data', async () => {
			repo.seedKpi({ totalStockValue: 0, totalActiveSku: 0, lowStockCount: 0 })

			const result = await service.handleKpi({ locationId: undefined })

			expect(result.totalStockValue).toBe(0)
			expect(result.totalActiveSku).toBe(0)
			expect(result.lowStockCount).toBe(0)
		})
	})
})
