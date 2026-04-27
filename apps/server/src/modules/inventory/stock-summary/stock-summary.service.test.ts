import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StockSummaryService } from './stock-summary.service'
import { StockSummaryRepo } from './stock-summary.repo'
import type { MaterialLocationService } from '@/modules/material'
import * as dto from './stock-summary.dto'

// Mock database
vi.mock('@/db', () => ({
	db: {
		transaction: vi.fn(),
		execute: vi.fn(),
	},
}))

// Mock date utilities
vi.mock('@/core/utils/date.util', () => ({
	toWibDateKey: vi.fn((date) => date),
	toWibDayBounds: vi.fn((date) => ({
		start: new Date(date.setHours(0, 0, 0, 0)),
		end: new Date(date.setHours(23, 59, 59, 999)),
	})),
}))

import { db } from '@/db'

describe('StockSummaryService', () => {
	let service: StockSummaryService
	let fakeRepo: StockSummaryRepo
	let fakeMaterialLocationService: MaterialLocationService

	beforeEach(() => {
		fakeRepo = {
			getByLocationPaginated: vi.fn(),
			getLedgerPaginated: vi.fn(),
			upsertMany: vi.fn(),
			softDelete: vi.fn(),
			hardDelete: vi.fn(),
		} as any

		fakeMaterialLocationService = {
			findByLocationId: vi.fn(),
		} as any

		service = new StockSummaryService(fakeMaterialLocationService)

		// Replace private repo with mock
		;(service as any).repo = fakeRepo
	})

	describe('handleByLocation', () => {
		it('should return paginated stock summaries by location', async () => {
			const filter: dto.StockSummaryFilterDto = {
				locationId: 1,
				date: new Date(),
				page: 1,
				limit: 10,
			}

			const mockResult = {
				data: [
					{
						id: 1,
						materialId: 1,
						locationId: 1,
						date: new Date(),
						openingQty: '100',
						closingQty: '150',
						openingValue: '1000',
						closingValue: '1500',
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			vi.spyOn(fakeRepo, 'getByLocationPaginated').mockResolvedValue(mockResult)

			const result = await service.handleByLocation(filter)

			expect(fakeRepo.getByLocationPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleLedger', () => {
		it('should return paginated stock ledger', async () => {
			const filter: dto.StockLedgerFilterDto = {
				locationId: 1,
				materialId: 1,
				startDate: new Date(),
				endDate: new Date(),
				page: 1,
				limit: 10,
			}

			const mockResult = {
				data: [
					{
						id: 1,
						materialId: 1,
						locationId: 1,
						date: new Date(),
						transactionType: 'purchase',
						quantity: '50',
						runningBalance: '150',
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			vi.spyOn(fakeRepo, 'getLedgerPaginated').mockResolvedValue(mockResult)

			const result = await service.handleLedger(filter)

			expect(fakeRepo.getLedgerPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleGenerate', () => {
		it('should generate stock summaries successfully', async () => {
			const data: dto.GenerateSummaryDto = {
				locationId: 1,
				date: new Date('2024-01-15'),
			}

			const actorId = 1
			const generatedCount = 5

			const mockAssignments = [
				{ materialId: 1, locationId: 1 },
				{ materialId: 2, locationId: 1 },
			]

			const mockTransaction = vi.fn().mockImplementation(async (callback) => {
				// Mock the complex SQL queries and calculations
				const mockPrevSummaries = [
					{ materialId: 1, closingQty: '100', closingAvgCost: '10' },
					{ materialId: 2, closingQty: '50', closingAvgCost: '20' },
				]

				const mockMovements = [
					{ materialId: 1, type: 'purchase', qty: '50', totalCost: '500' },
					{ materialId: 2, type: 'sell', qty: '10', totalCost: '200' },
				]

				const mockLastTransactions = [
					{ materialId: 1, runningAvgCost: '11' },
					{ materialId: 2, runningAvgCost: '19' },
				]

				// Mock the database execute calls
				const mockExecute = vi.fn()
					.mockResolvedValueOnce(mockPrevSummaries) // prevSummariesQuery
					.mockResolvedValueOnce(mockMovements) // movements query
					.mockResolvedValueOnce(mockLastTransactions) // lastTransactionsQuery

				const mockTx = {
					execute: mockExecute,
					select: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue(mockMovements),
						}),
					}),
				}

				vi.spyOn(fakeRepo, 'upsertMany').mockResolvedValue(generatedCount)

				return await callback(mockTx)
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			vi.spyOn(fakeMaterialLocationService, 'findByLocationId').mockResolvedValue(mockAssignments as any)

			const result = await service.handleGenerate(data, actorId)

			expect(fakeMaterialLocationService.findByLocationId).toHaveBeenCalledWith(1)
			expect(fakeRepo.upsertMany).toHaveBeenCalled()
			expect(result).toEqual({ generatedCount })
		})

		it('should return zero generated count when no assignments found', async () => {
			const data: dto.GenerateSummaryDto = {
				locationId: 999,
				date: new Date('2024-01-15'),
			}

			const actorId = 1

			vi.spyOn(fakeMaterialLocationService, 'findByLocationId').mockResolvedValue([])

			const result = await service.handleGenerate(data, actorId)

			expect(fakeMaterialLocationService.findByLocationId).toHaveBeenCalledWith(999)
			expect(result).toEqual({ generatedCount: 0 })
			expect(db.transaction).not.toHaveBeenCalled()
		})
	})

	describe('handleRemove', () => {
		it('should soft delete stock summary', async () => {
			const summaryId = 1
			const actorId = 1
			const mockResult = { id: 1 }

			vi.spyOn(fakeRepo, 'softDelete').mockResolvedValue(mockResult)

			const result = await service.handleRemove(summaryId, actorId)

			expect(fakeRepo.softDelete).toHaveBeenCalledWith(summaryId, actorId)
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleHardRemove', () => {
		it('should hard delete stock summary', async () => {
			const summaryId = 1
			const mockResult = { id: 1 }

			vi.spyOn(fakeRepo, 'hardDelete').mockResolvedValue(mockResult)

			const result = await service.handleHardRemove(summaryId)

			expect(fakeRepo.hardDelete).toHaveBeenCalledWith(summaryId)
			expect(result).toEqual(mockResult)
		})
	})

	describe('complex stock calculations', () => {
		it('should handle complex stock movement calculations', async () => {
			const data: dto.GenerateSummaryDto = {
				locationId: 1,
				date: new Date('2024-01-15'),
			}

			const actorId = 1

			const mockAssignments = [
				{ materialId: 1, locationId: 1 },
			]

			const mockTransaction = vi.fn().mockImplementation(async (callback) => {
				// Mock complex scenario with multiple movement types
				const mockPrevSummaries = [
					{ materialId: 1, closingQty: '100', closingAvgCost: '10' },
				]

				const mockMovements = [
					{ materialId: 1, type: 'purchase', qty: '50', totalCost: '550' }, // avg cost 11
					{ materialId: 1, type: 'transfer_in', qty: '20', totalCost: '220' }, // avg cost 11
					{ materialId: 1, type: 'transfer_out', qty: '30', totalCost: '330' }, // avg cost 11
					{ materialId: 1, type: 'adjustment', qty: '5', totalCost: '55' }, // avg cost 11
					{ materialId: 1, type: 'sell', qty: '25', totalCost: '275' }, // avg cost 11
					{ materialId: 1, type: 'usage', qty: '10', totalCost: '110' }, // avg cost 11
					{ materialId: 1, type: 'production_in', qty: '15', totalCost: '165' }, // avg cost 11
					{ materialId: 1, type: 'production_out', qty: '8', totalCost: '88' }, // avg cost 11
				]

				const mockLastTransactions = [
					{ materialId: 1, runningAvgCost: '11' },
				]

				const mockExecute = vi.fn()
					.mockResolvedValueOnce(mockPrevSummaries)
					.mockResolvedValueOnce(mockMovements)
					.mockResolvedValueOnce(mockLastTransactions)

				const mockTx = {
					execute: mockExecute,
					select: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							groupBy: vi.fn().mockResolvedValue(mockMovements),
						}),
					}),
				}

				vi.spyOn(fakeRepo, 'upsertMany').mockResolvedValue(1)

				return await callback(mockTx)
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			vi.spyOn(fakeMaterialLocationService, 'findByLocationId').mockResolvedValue(mockAssignments as any)

			const result = await service.handleGenerate(data, actorId)

			expect(fakeRepo.upsertMany).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						materialId: 1,
						locationId: 1,
						openingQty: '100',
						openingAvgCost: '10',
						openingValue: '1000',
						purchaseQty: '50',
						purchaseValue: '550',
						transferInQty: '20',
						transferInValue: '220',
						transferOutQty: '30',
						transferOutValue: '330',
						adjustmentQty: '5',
						adjustmentValue: '55',
						usageQty: '10',
						usageValue: '110',
						sellQty: '25',
						sellValue: '275',
						productionInQty: '15',
						productionInValue: '165',
						productionOutQty: '8',
						productionOutValue: '88',
						// Closing calculation: 100 + 50 + 20 - 30 + 5 + 15 - 8 - 10 - 25 = 117
						closingQty: '117',
						closingAvgCost: '11',
						closingValue: '1287', // 117 * 11
					}),
				])
			)
			expect(result).toEqual({ generatedCount: 1 })
		})
	})
})
