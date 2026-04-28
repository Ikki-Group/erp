import { AnalyticsService, type PnLData, type TopSalesItem } from './analytics.service'
import { beforeEach, describe, expect, it, mock, spyOn, vi } from 'bun:test'

// Mock cache
vi.mock('@/core/cache', () => ({
	bento: {
		namespace: () => ({
			getOrSet: mock(),
		}),
	},
}))

// Mock database
vi.mock('@/db', () => ({
	db: {
		select: mock().mockReturnValue({
			from: mock().mockReturnValue({
				innerJoin: mock().mockReturnValue({
					where: mock().mockReturnValue({
						groupBy: mock().mockReturnValue({
							orderBy: mock().mockReturnValue({
								limit: mock().mockResolvedValue([]),
							}),
						}),
					}),
				}),
			}),
		}),
	},
}))

import { bento } from '@/core/cache'

import { db } from '@/db'

describe('AnalyticsService', () => {
	let service: AnalyticsService
	let mockCache: any

	beforeEach(() => {
		service = new AnalyticsService()
		mockCache = {
			getOrSet: mock().mockImplementation(async ({ factory }) => {
				return await factory()
			}),
		}
		;(bento.namespace as any).mockReturnValue(mockCache)
	})

	describe('getPnL', () => {
		it('should calculate P&L from general ledger data', async () => {
			const startDate = new Date('2024-01-01')
			const endDate = new Date('2024-01-31')

			const mockGlItems = [
				{ accountCode: '4001', debit: '0', credit: '10000' }, // Revenue
				{ accountCode: '4002', debit: '0', credit: '5000' }, // Revenue
				{ accountCode: '5101', debit: '3000', credit: '0' }, // COGS
				{ accountCode: '5201', debit: '2000', credit: '0' }, // Operating expenses
				{ accountCode: '5202', debit: '1000', credit: '0' }, // Operating expenses
			]

			const mockSelect = mock().mockReturnValue({
				from: mock().mockReturnValue({
					innerJoin: mock().mockReturnValue({
						innerJoin: mock().mockReturnValue({
							where: mock().mockResolvedValue(mockGlItems),
						}),
					}),
				}),
			})

			;(db.select as any).mockReturnValue(mockSelect)

			const result = await service.getPnL(startDate, endDate)

			expect(mockCache.getOrSet).toHaveBeenCalledWith({
				key: `pnl.${startDate.toISOString()}.${endDate.toISOString()}`,
				ttl: '1h',
				factory: expect.any(Function),
			})

			const expectedPnL: PnLData = {
				revenue: 15000, // 10000 + 5000
				cogs: 3000, // 3000 - 0
				operatingExpenses: 3000, // 2000 + 1000
				netProfit: 9000, // 15000 - 3000 - 3000
				period: { start: startDate, end: endDate },
			}

			expect(result).toEqual(expectedPnL)
		})

		it('should handle empty GL data', async () => {
			const startDate = new Date('2024-01-01')
			const endDate = new Date('2024-01-31')

			const mockSelect = mock().mockReturnValue({
				from: mock().mockReturnValue({
					innerJoin: mock().mockReturnValue({
						innerJoin: mock().mockReturnValue({
							where: mock().mockResolvedValue([]),
						}),
					}),
				}),
			})

			;(db.select as any).mockReturnValue(mockSelect)

			const result = await service.getPnL(startDate, endDate)

			const expectedPnL: PnLData = {
				revenue: 0,
				cogs: 0,
				operatingExpenses: 0,
				netProfit: 0,
				period: { start: startDate, end: endDate },
			}

			expect(result).toEqual(expectedPnL)
		})

		it('should use cache for P&L data', async () => {
			const startDate = new Date('2024-01-01')
			const endDate = new Date('2024-01-31')

			const cachedPnL: PnLData = {
				revenue: 5000,
				cogs: 1000,
				operatingExpenses: 500,
				netProfit: 3500,
				period: { start: startDate, end: endDate },
			}

			mockCache.getOrSet.mockResolvedValue(cachedPnL)

			const result = await service.getPnL(startDate, endDate)

			expect(result).toEqual(cachedPnL)
		})
	})

	describe('getTopSales', () => {
		it('should return top sales items', async () => {
			const startDate = new Date('2024-01-01')
			const endDate = new Date('2024-01-31')
			const limit = 3

			const mockSalesData = [
				{
					productId: 1,
					itemName: 'Product A',
					totalQuantity: '100',
					totalRevenue: '10000',
				},
				{
					productId: 2,
					itemName: 'Product B',
					totalQuantity: '50',
					totalRevenue: '7500',
				},
				{
					productId: 3,
					itemName: 'Product C',
					totalQuantity: '75',
					totalRevenue: '5000',
				},
			]

			const mockSelect = mock().mockReturnValue({
				from: mock().mockReturnValue({
					innerJoin: mock().mockReturnValue({
						where: mock().mockReturnValue({
							groupBy: mock().mockReturnValue({
								orderBy: mock().mockReturnValue({
									limit: mock().mockResolvedValue(mockSalesData),
								}),
							}),
						}),
					}),
				}),
			})

			;(db.select as any).mockReturnValue(mockSelect)

			const result = await service.getTopSales(startDate, endDate, limit)

			expect(mockCache.getOrSet).toHaveBeenCalledWith({
				key: `top_sales.${startDate.toISOString()}.${endDate.toISOString()}.${limit}`,
				ttl: '30m',
				factory: expect.any(Function),
			})

			const expectedTopSales: TopSalesItem[] = [
				{
					productId: 1,
					itemName: 'Product A',
					totalQuantity: 100,
					totalRevenue: 10000,
				},
				{
					productId: 2,
					itemName: 'Product B',
					totalQuantity: 50,
					totalRevenue: 7500,
				},
				{
					productId: 3,
					itemName: 'Product C',
					totalQuantity: 75,
					totalRevenue: 5000,
				},
			]

			expect(result).toEqual(expectedTopSales)
		})

		it('should use default limit of 5', async () => {
			const startDate = new Date('2024-01-01')
			const endDate = new Date('2024-01-31')

			const mockSelect = mock().mockReturnValue({
				from: mock().mockReturnValue({
					innerJoin: mock().mockReturnValue({
						where: mock().mockReturnValue({
							groupBy: mock().mockReturnValue({
								orderBy: mock().mockReturnValue({
									limit: mock().mockResolvedValue([]),
								}),
							}),
						}),
					}),
				}),
			})

			;(db.select as any).mockReturnValue(mockSelect)

			await service.getTopSales(startDate, endDate)

			const mockLimit = mockSelect
				.mockReturnValue({})
				.from({})
				.innerJoin({})
				.where({})
				.groupBy({})
				.orderBy({}).limit

			expect(mockLimit).toHaveBeenCalledWith(5)
		})

		it('should handle empty sales data', async () => {
			const startDate = new Date('2024-01-01')
			const endDate = new Date('2024-01-31')

			const mockSelect = mock().mockReturnValue({
				from: mock().mockReturnValue({
					innerJoin: mock().mockReturnValue({
						where: mock().mockReturnValue({
							groupBy: mock().mockReturnValue({
								orderBy: mock().mockReturnValue({
									limit: mock().mockResolvedValue([]),
								}),
							}),
						}),
					}),
				}),
			})

			;(db.select as any).mockReturnValue(mockSelect)

			const result = await service.getTopSales(startDate, endDate)

			expect(result).toEqual([])
		})

		it('should use cache for top sales data', async () => {
			const startDate = new Date('2024-01-01')
			const endDate = new Date('2024-01-31')
			const limit = 3

			const cachedTopSales: TopSalesItem[] = [
				{
					productId: 1,
					itemName: 'Cached Product',
					totalQuantity: 200,
					totalRevenue: 20000,
				},
			]

			mockCache.getOrSet.mockResolvedValue(cachedTopSales)

			const result = await service.getTopSales(startDate, endDate, limit)

			expect(result).toEqual(cachedTopSales)
		})
	})
})
