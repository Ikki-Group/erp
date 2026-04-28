import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { GoodsReceiptService } from './goods-receipt.service'
import { GoodsReceiptRepo } from './goods-receipt.repo'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { StockTransactionService } from '@/modules/inventory'
import * as dto from './goods-receipt.dto'

// Mock database transaction
vi.mock('@/db', () => ({
	db: {
		transaction: spyOn(),
	},
}))

// Mock database schema
vi.mock('@/db/schema', () => ({
	purchaseOrderItemsTable: {
		id: 'id',
		unitPrice: 'unitPrice',
	},
}))

import { db } from '@/db'

describe('GoodsReceiptService', () => {
	let service: GoodsReceiptService
	let fakeRepo: GoodsReceiptRepo
	let fakeInventoryService: StockTransactionService

	beforeEach(() => {
		fakeRepo = {
			getById: spyOn(),
			getListPaginated: spyOn(),
			create: spyOn(),
			updateStatus: spyOn(),
			softDelete: spyOn(),
			hardDelete: spyOn(),
		} as any

		fakeInventoryService = {
			handlePurchase: spyOn(),
		} as any

		service = new GoodsReceiptService(fakeInventoryService)

		// Replace private repo with mock
		;(service as any).repo = fakeRepo
	})

	describe('getById', () => {
		it('should return GRN when found', async () => {
			const mockGRN: dto.GoodsReceiptNoteDto = {
				id: 1,
				purchaseOrderId: 1,
				locationId: 1,
				receiveDate: new Date(),
				status: 'open',
				notes: 'Test GRN',
				items: [
					{
						id: 1,
						materialId: 1,
						quantityReceived: '100',
						purchaseOrderItemId: 1,
					},
				],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'getById').mockResolvedValue(mockGRN)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockGRN)
		})

		it('should throw NotFoundError when GRN not found', async () => {
			spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			await expect(service.getById(999)).rejects.toThrow(
				new NotFoundError('GRN with ID 999 not found', 'GRN_NOT_FOUND')
			)
		})
	})

	describe('handleList', () => {
		it('should return paginated GRNs', async () => {
			const filter: dto.GoodsReceiptNoteFilterDto = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						purchaseOrderId: 1,
						locationId: 1,
						receiveDate: new Date(),
						status: 'open',
						createdAt: new Date(),
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)

			const result = await service.handleList(filter)

			expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockPaginatedResult)
		})
	})

	describe('handleDetail', () => {
		it('should return GRN detail', async () => {
			const mockGRN: dto.GoodsReceiptNoteDto = {
				id: 1,
				purchaseOrderId: 1,
				locationId: 1,
				receiveDate: new Date(),
				status: 'open',
				notes: 'Test GRN',
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(service, 'getById').mockResolvedValue(mockGRN)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockGRN)
		})
	})

	describe('handleCreate', () => {
		it('should create GRN successfully', async () => {
			const createData: dto.GoodsReceiptNoteCreateDto = {
				purchaseOrderId: 1,
				locationId: 1,
				receiveDate: new Date(),
				notes: 'Test GRN',
				items: [
					{
						materialId: 1,
						quantityReceived: '100',
						purchaseOrderItemId: 1,
					},
				],
			}

			const actorId = 1
			const mockResult = { id: 1 }

			spyOn(fakeRepo, 'create').mockResolvedValue(mockResult)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleComplete', () => {
		it('should complete GRN successfully', async () => {
			const mockGRN: dto.GoodsReceiptNoteDto = {
				id: 1,
				purchaseOrderId: 1,
				locationId: 1,
				receiveDate: new Date(),
				status: 'open',
				notes: 'Test GRN',
				items: [
					{
						id: 1,
						materialId: 1,
						quantityReceived: '100',
						purchaseOrderItemId: 1,
					},
					{
						id: 2,
						materialId: 2,
						quantityReceived: '50',
						purchaseOrderItemId: 2,
					},
				],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockPOItems = [
				{ id: 1, unitPrice: '10.50' },
				{ id: 2, unitPrice: '25.00' },
			]

			const actorId = 1
			const mockResult = { id: 1 }

			const mockTransaction = spyOn().mockImplementation(async (callback) => {
				const mockTx = {
					select: spyOn().mockReturnValue({
						from: spyOn().mockReturnValue({
							where: spyOn().mockResolvedValue(mockPOItems),
						}),
					}),
				}
				return await callback(mockTx)
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			spyOn(service, 'getById').mockResolvedValue(mockGRN)
			spyOn(fakeInventoryService, 'handlePurchase').mockResolvedValue(undefined)
			spyOn(fakeRepo, 'updateStatus').mockResolvedValue(mockResult)

			const result = await service.handleComplete(1, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeInventoryService.handlePurchase).toHaveBeenCalledWith(
				{
					locationId: 1,
					date: mockGRN.receiveDate,
					referenceNo: 'GRN-1',
					notes: 'Test GRN',
					items: [
						{
							materialId: 1,
							qty: '100',
							unitCost: '10.50',
						},
						{
							materialId: 2,
							qty: '50',
							unitCost: '25.00',
						},
					],
				},
				actorId,
				expect.any(Object)
			)
			expect(fakeRepo.updateStatus).toHaveBeenCalledWith(1, 'completed', actorId)
			expect(result).toEqual(mockResult)
		})

		it('should throw ConflictError when GRN is not open', async () => {
			const mockGRN: dto.GoodsReceiptNoteDto = {
				id: 1,
				purchaseOrderId: 1,
				locationId: 1,
				receiveDate: new Date(),
				status: 'completed',
				notes: 'Test GRN',
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1

			spyOn(service, 'getById').mockResolvedValue(mockGRN)

			await expect(service.handleComplete(1, actorId)).rejects.toThrow(
				new ConflictError('GRN is already completed', 'GRN_STATUS_CONFLICT')
			)

			expect(fakeInventoryService.handlePurchase).not.toHaveBeenCalled()
			expect(fakeRepo.updateStatus).not.toHaveBeenCalled()
		})

		it('should handle GRN completion without PO items', async () => {
			const mockGRN: dto.GoodsReceiptNoteDto = {
				id: 1,
				purchaseOrderId: 1,
				locationId: 1,
				receiveDate: new Date(),
				status: 'open',
				notes: 'Test GRN',
				items: [
					{
						id: 1,
						materialId: 1,
						quantityReceived: '100',
						purchaseOrderItemId: null,
					},
				],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1
			const mockResult = { id: 1 }

			const mockTransaction = spyOn().mockImplementation(async (callback) => {
				const mockTx = {
					select: spyOn().mockReturnValue({
						from: spyOn().mockReturnValue({
							where: spyOn().mockResolvedValue([]),
						}),
					}),
				}
				return await callback(mockTx)
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			spyOn(service, 'getById').mockResolvedValue(mockGRN)
			spyOn(fakeInventoryService, 'handlePurchase').mockResolvedValue(undefined)
			spyOn(fakeRepo, 'updateStatus').mockResolvedValue(mockResult)

			await service.handleComplete(1, actorId)

			expect(fakeInventoryService.handlePurchase).toHaveBeenCalledWith(
				{
					locationId: 1,
					date: mockGRN.receiveDate,
					referenceNo: 'GRN-1',
					notes: 'Test GRN',
					items: [
						{
							materialId: 1,
							qty: '100',
							unitCost: '0',
						},
					],
				},
				actorId,
				expect.any(Object)
			)
		})
	})

	describe('handleRemove', () => {
		it('should soft delete GRN successfully', async () => {
			const grnId = 1
			const actorId = 1
			const mockResult = { id: 1 }

			spyOn(fakeRepo, 'softDelete').mockResolvedValue(mockResult)

			const result = await service.handleRemove(grnId, actorId)

			expect(fakeRepo.softDelete).toHaveBeenCalledWith(grnId, actorId)
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleHardRemove', () => {
		it('should hard delete GRN successfully', async () => {
			const grnId = 1
			const mockResult = { id: 1 }

			spyOn(fakeRepo, 'hardDelete').mockResolvedValue(mockResult)

			const result = await service.handleHardRemove(grnId)

			expect(fakeRepo.hardDelete).toHaveBeenCalledWith(grnId)
			expect(result).toEqual(mockResult)
		})
	})
})
