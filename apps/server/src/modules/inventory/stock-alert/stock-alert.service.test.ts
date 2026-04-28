import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { StockAlertService } from './stock-alert.service'
import { StockAlertRepo } from './stock-alert.repo'
import * as dto from './stock-alert.dto'

describe('StockAlertService', () => {
	let service: StockAlertService
	let fakeRepo: StockAlertRepo

	beforeEach(() => {
		fakeRepo = {
			getAlerts: spyOn(),
			getAlertCount: spyOn(),
		} as any

		service = new StockAlertService()

		// Replace private repo with mock
		;(service as any).repo = fakeRepo
	})

	describe('handleAlerts', () => {
		it('should return stock alerts with pagination', async () => {
			const filter: dto.StockAlertFilterDto & { page?: number; limit?: number } = {
				locationId: 1,
				alertType: 'low_stock',
				page: 1,
				limit: 10,
			}

			const mockAlerts = {
				data: [
					{
						id: 1,
						materialId: 1,
						locationId: 1,
						alertType: 'low_stock',
						currentQty: 5,
						minStock: 10,
						message: 'Stock below minimum level',
						createdAt: new Date(),
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			spyOn(fakeRepo, 'getAlerts').mockResolvedValue(mockAlerts)

			const result = await service.handleAlerts(filter)

			expect(fakeRepo.getAlerts).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockAlerts)
		})

		it('should return stock alerts without pagination', async () => {
			const filter: dto.StockAlertFilterDto & { page?: number; limit?: number } = {
				locationId: 1,
				alertType: 'overstock',
			}

			const mockAlerts = {
				data: [
					{
						id: 2,
						materialId: 2,
						locationId: 1,
						alertType: 'overstock',
						currentQty: 500,
						maxStock: 200,
						message: 'Stock above maximum level',
						createdAt: new Date(),
					},
				],
				meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
			}

			spyOn(fakeRepo, 'getAlerts').mockResolvedValue(mockAlerts)

			const result = await service.handleAlerts(filter)

			expect(fakeRepo.getAlerts).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockAlerts)
		})

		it('should return all alert types', async () => {
			const filter: dto.StockAlertFilterDto & { page?: number; limit?: number } = {
				locationId: 1,
			}

			const mockAlerts = {
				data: [
					{
						id: 1,
						materialId: 1,
						locationId: 1,
						alertType: 'low_stock',
						currentQty: 5,
						minStock: 10,
						message: 'Stock below minimum level',
						createdAt: new Date(),
					},
					{
						id: 2,
						materialId: 2,
						locationId: 1,
						alertType: 'overstock',
						currentQty: 500,
						maxStock: 200,
						message: 'Stock above maximum level',
						createdAt: new Date(),
					},
					{
						id: 3,
						materialId: 3,
						locationId: 1,
						alertType: 'reorder_point',
						currentQty: 15,
						reorderPoint: 20,
						message: 'Stock at reorder point',
						createdAt: new Date(),
					},
				],
				meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
			}

			spyOn(fakeRepo, 'getAlerts').mockResolvedValue(mockAlerts)

			const result = await service.handleAlerts(filter)

			expect(fakeRepo.getAlerts).toHaveBeenCalledWith(filter)
			expect(result.data).toHaveLength(3)
			expect(result.data.map(alert => alert.alertType)).toEqual(['low_stock', 'overstock', 'reorder_point'])
		})
	})

	describe('handleCount', () => {
		it('should return alert count for specific filter', async () => {
			const filter: dto.StockAlertFilterDto = {
				locationId: 1,
				alertType: 'low_stock',
			}

			const mockCount = 5

			spyOn(fakeRepo, 'getAlertCount').mockResolvedValue(mockCount)

			const result = await service.handleCount(filter)

			expect(fakeRepo.getAlertCount).toHaveBeenCalledWith(filter)
			expect(result).toBe(mockCount)
		})

		it('should return total alert count when no filter specified', async () => {
			const filter: dto.StockAlertFilterDto = {}

			const mockCount = 25

			spyOn(fakeRepo, 'getAlertCount').mockResolvedValue(mockCount)

			const result = await service.handleCount(filter)

			expect(fakeRepo.getAlertCount).toHaveBeenCalledWith(filter)
			expect(result).toBe(mockCount)
		})

		it('should return count for multiple locations', async () => {
			const filter: dto.StockAlertFilterDto = {
				locationIds: [1, 2, 3],
			}

			const mockCount = 12

			spyOn(fakeRepo, 'getAlertCount').mockResolvedValue(mockCount)

			const result = await service.handleCount(filter)

			expect(fakeRepo.getAlertCount).toHaveBeenCalledWith(filter)
			expect(result).toBe(mockCount)
		})

		it('should return count for specific materials', async () => {
			const filter: dto.StockAlertFilterDto = {
				materialIds: [1, 2, 3],
			}

			const mockCount = 8

			spyOn(fakeRepo, 'getAlertCount').mockResolvedValue(mockCount)

			const result = await service.handleCount(filter)

			expect(fakeRepo.getAlertCount).toHaveBeenCalledWith(filter)
			expect(result).toBe(mockCount)
		})
	})
})
