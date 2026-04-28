import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { StockTransactionService } from './stock-transaction.service'
import { StockHistoryService } from './sub-services/stock-history.service'
import { StockExternalMovementService } from './sub-services/stock-external-movement.service'
import { StockInternalMovementService } from './sub-services/stock-internal-movement.service'
import type { MaterialLocationService } from '@/modules/material'
import * as dto from './stock-transaction.dto'

describe('StockTransactionService', () => {
	let service: StockTransactionService
	let fakeMaterialLocationService: MaterialLocationService
	let mockHistoryService: StockHistoryService
	let mockExternalService: StockExternalMovementService
	let mockInternalService: StockInternalMovementService

	beforeEach(() => {
		fakeMaterialLocationService = {} as MaterialLocationService

		// Mock the sub-services
		mockHistoryService = {
			handleList: vi.fn(),
			handleDetail: vi.fn(),
			handleRemove: vi.fn(),
			handleHardRemove: vi.fn(),
		} as any

		mockExternalService = {
			handlePurchase: vi.fn(),
			handleProductionIn: vi.fn(),
			handleUsage: vi.fn(),
			handleSell: vi.fn(),
			handleProductionOut: vi.fn(),
		} as any

		mockInternalService = {
			handleTransfer: vi.fn(),
			handleAdjustment: vi.fn(),
			handleOpname: vi.fn(),
		} as any

		service = new StockTransactionService(fakeMaterialLocationService)

		// Replace the private services with mocks
		;(service as any).history = mockHistoryService
		;(service as any).external = mockExternalService
		;(service as any).internal = mockInternalService
	})

	describe('handleList', () => {
		it('should delegate to history service', async () => {
			const filter: dto.StockTransactionFilterDto = { page: 1, limit: 10 }
			const mockResult = {
				data: [
					{
						id: 1,
						type: 'purchase',
						materialId: 1,
						locationId: 1,
						quantity: 100,
						date: new Date(),
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			vi.spyOn(mockHistoryService, 'handleList').mockResolvedValue(mockResult)

			const result = await service.handleList(filter)

			expect(mockHistoryService.handleList).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleDetail', () => {
		it('should delegate to history service', async () => {
			const transactionId = 1
			const mockTransaction: dto.StockTransactionDto = {
				id: 1,
				type: 'purchase',
				materialId: 1,
				locationId: 1,
				quantity: 100,
				date: new Date(),
				reference: 'PO-001',
				note: 'Test purchase',
			}

			vi.spyOn(mockHistoryService, 'handleDetail').mockResolvedValue(mockTransaction)

			const result = await service.handleDetail(transactionId)

			expect(mockHistoryService.handleDetail).toHaveBeenCalledWith(transactionId)
			expect(result).toEqual(mockTransaction)
		})
	})

	describe('handleRemove', () => {
		it('should delegate to history service', async () => {
			const transactionId = 1
			const actorId = 1
			const mockResult = { id: 1 }

			vi.spyOn(mockHistoryService, 'handleRemove').mockResolvedValue(mockResult)

			const result = await service.handleRemove(transactionId, actorId)

			expect(mockHistoryService.handleRemove).toHaveBeenCalledWith(transactionId, actorId)
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleHardRemove', () => {
		it('should delegate to history service', async () => {
			const transactionId = 1
			const mockResult = { id: 1 }

			vi.spyOn(mockHistoryService, 'handleHardRemove').mockResolvedValue(mockResult)

			const result = await service.handleHardRemove(transactionId)

			expect(mockHistoryService.handleHardRemove).toHaveBeenCalledWith(transactionId)
			expect(result).toEqual(mockResult)
		})
	})

	describe('handlePurchase', () => {
		it('should delegate to external service', async () => {
			const purchaseData: dto.PurchaseTransactionDto = {
				materialId: 1,
				locationId: 1,
				quantity: 100,
				cost: 1000,
				date: new Date(),
				reference: 'PO-001',
				note: 'Test purchase',
			}

			const actorId = 1
			const mockResult: dto.TransactionResultDto = {
				transactionId: 1,
				newStock: 100,
				message: 'Purchase recorded successfully',
			}

			vi.spyOn(mockExternalService, 'handlePurchase').mockResolvedValue(mockResult)

			const result = await service.handlePurchase(purchaseData, actorId)

			expect(mockExternalService.handlePurchase).toHaveBeenCalledWith(purchaseData, actorId, expect.any(Object))
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleProductionIn', () => {
		it('should delegate to external service', async () => {
			const productionInData: dto.ProductionInTransactionDto = {
				materialId: 1,
				locationId: 1,
				quantity: 50,
				date: new Date(),
				reference: 'PROD-IN-001',
				note: 'Production input',
			}

			const actorId = 1
			const mockResult: dto.TransactionResultDto = {
				transactionId: 2,
				newStock: 150,
				message: 'Production input recorded successfully',
			}

			vi.spyOn(mockExternalService, 'handleProductionIn').mockResolvedValue(mockResult)

			const result = await service.handleProductionIn(productionInData, actorId)

			expect(mockExternalService.handleProductionIn).toHaveBeenCalledWith(productionInData, actorId, expect.any(Object))
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleUsage', () => {
		it('should delegate to external service', async () => {
			const usageData: dto.UsageTransactionDto = {
				materialId: 1,
				locationId: 1,
				quantity: 25,
				date: new Date(),
				reference: 'USAGE-001',
				note: 'Material usage',
			}

			const actorId = 1
			const mockResult: dto.TransactionResultDto = {
				transactionId: 3,
				newStock: 125,
				message: 'Usage recorded successfully',
			}

			vi.spyOn(mockExternalService, 'handleUsage').mockResolvedValue(mockResult)

			const result = await service.handleUsage(usageData, actorId)

			expect(mockExternalService.handleUsage).toHaveBeenCalledWith(usageData, actorId, expect.any(Object))
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleSell', () => {
		it('should delegate to external service', async () => {
			const sellData: dto.SellTransactionDto = {
				materialId: 1,
				locationId: 1,
				quantity: 30,
				price: 1500,
				date: new Date(),
				reference: 'SALE-001',
				note: 'Material sale',
			}

			const actorId = 1
			const mockResult: dto.TransactionResultDto = {
				transactionId: 4,
				newStock: 95,
				message: 'Sale recorded successfully',
			}

			vi.spyOn(mockExternalService, 'handleSell').mockResolvedValue(mockResult)

			const result = await service.handleSell(sellData, actorId)

			expect(mockExternalService.handleSell).toHaveBeenCalledWith(sellData, actorId, expect.any(Object))
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleProductionOut', () => {
		it('should delegate to external service', async () => {
			const productionOutData: dto.ProductionOutTransactionDto = {
				materialId: 1,
				locationId: 1,
				quantity: 40,
				date: new Date(),
				reference: 'PROD-OUT-001',
				note: 'Production output',
			}

			const actorId = 1
			const mockResult: dto.TransactionResultDto = {
				transactionId: 5,
				newStock: 55,
				message: 'Production output recorded successfully',
			}

			vi.spyOn(mockExternalService, 'handleProductionOut').mockResolvedValue(mockResult)

			const result = await service.handleProductionOut(productionOutData, actorId)

			expect(mockExternalService.handleProductionOut).toHaveBeenCalledWith(productionOutData, actorId, expect.any(Object))
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleTransfer', () => {
		it('should delegate to internal service', async () => {
			const transferData: dto.TransferTransactionDto = {
				materialId: 1,
				fromLocationId: 1,
				toLocationId: 2,
				quantity: 20,
				date: new Date(),
				reference: 'TRANSFER-001',
				note: 'Material transfer',
			}

			const actorId = 1
			const mockResult: dto.TransactionResultDto = {
				transactionId: 6,
				newStock: 35,
				message: 'Transfer recorded successfully',
			}

			vi.spyOn(mockInternalService, 'handleTransfer').mockResolvedValue(mockResult)

			const result = await service.handleTransfer(transferData, actorId)

			expect(mockInternalService.handleTransfer).toHaveBeenCalledWith(transferData, actorId, expect.any(Object))
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleAdjustment', () => {
		it('should delegate to internal service', async () => {
			const adjustmentData: dto.AdjustmentTransactionDto = {
				materialId: 1,
				locationId: 1,
				quantity: 5,
				adjustmentType: 'increase',
				date: new Date(),
				reference: 'ADJ-001',
				note: 'Stock adjustment',
			}

			const actorId = 1
			const mockResult: dto.TransactionResultDto = {
				transactionId: 7,
				newStock: 40,
				message: 'Adjustment recorded successfully',
			}

			vi.spyOn(mockInternalService, 'handleAdjustment').mockResolvedValue(mockResult)

			const result = await service.handleAdjustment(adjustmentData, actorId)

			expect(mockInternalService.handleAdjustment).toHaveBeenCalledWith(adjustmentData, actorId, expect.any(Object))
			expect(result).toEqual(mockResult)
		})
	})

	describe('handleOpname', () => {
		it('should delegate to internal service', async () => {
			const opnameData: dto.StockOpnameDto = {
				materialId: 1,
				locationId: 1,
				systemQuantity: 35,
				actualQuantity: 38,
				quantity: 3,
				date: new Date(),
				reference: 'OPNAME-001',
				note: 'Stock opname',
			}

			const actorId = 1
			const mockResult: dto.TransactionResultDto = {
				transactionId: 8,
				newStock: 38,
				message: 'Stock opname recorded successfully',
			}

			vi.spyOn(mockInternalService, 'handleOpname').mockResolvedValue(mockResult)

			const result = await service.handleOpname(opnameData, actorId)

			expect(mockInternalService.handleOpname).toHaveBeenCalledWith(opnameData, actorId, expect.any(Object))
			expect(result).toEqual(mockResult)
		})
	})
})
