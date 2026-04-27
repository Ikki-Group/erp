import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StockDashboardService } from './stock-dashboard.service'
import { StockDashboardRepo } from './stock-dashboard.repo'
import * as dto from './stock-dashboard.dto'

describe('StockDashboardService', () => {
	let service: StockDashboardService
	let fakeRepo: StockDashboardRepo

	beforeEach(() => {
		fakeRepo = {
			getKpi: vi.fn(),
		} as any

		service = new StockDashboardService()

		// Replace private repo with mock
		;(service as any).repo = fakeRepo
	})

	describe('handleKpi', () => {
		it('should return dashboard KPI data', async () => {
			const filter: dto.DashboardKpiFilterDto = {
				locationId: 1,
				date: new Date(),
			}

			const mockKpiData = {
				totalMaterials: 150,
				totalValue: 250000,
				lowStockAlerts: 12,
				overstockAlerts: 5,
				reorderAlerts: 8,
				totalTransactions: 245,
			}

			vi.spyOn(fakeRepo, 'getKpi').mockResolvedValue(mockKpiData)

			const result = await service.handleKpi(filter)

			expect(fakeRepo.getKpi).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockKpiData)
		})

		it('should handle KPI request without location filter', async () => {
			const filter: dto.DashboardKpiFilterDto = {
				date: new Date(),
			}

			const mockKpiData = {
				totalMaterials: 500,
				totalValue: 1000000,
				lowStockAlerts: 45,
				overstockAlerts: 20,
				reorderAlerts: 30,
				totalTransactions: 1250,
			}

			vi.spyOn(fakeRepo, 'getKpi').mockResolvedValue(mockKpiData)

			const result = await service.handleKpi(filter)

			expect(fakeRepo.getKpi).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockKpiData)
		})

		it('should handle empty KPI data', async () => {
			const filter: dto.DashboardKpiFilterDto = {}

			const mockKpiData = {
				totalMaterials: 0,
				totalValue: 0,
				lowStockAlerts: 0,
				overstockAlerts: 0,
				reorderAlerts: 0,
				totalTransactions: 0,
			}

			vi.spyOn(fakeRepo, 'getKpi').mockResolvedValue(mockKpiData)

			const result = await service.handleKpi(filter)

			expect(result).toEqual(mockKpiData)
		})
	})
})
