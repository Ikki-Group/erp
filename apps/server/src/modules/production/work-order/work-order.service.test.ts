import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WorkOrderService } from './work-order.service'
import { WorkOrderRepo } from './work-order.repo'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import type { RecipeService } from '@/modules/recipe'
import type { InventoryServiceModule } from '@/modules/inventory'
import * as dto from './work-order.dto'

// Mock database transaction
vi.mock('@/db', () => ({
	db: {
		transaction: vi.fn(),
	},
}))

import { db } from '@/db'

describe('WorkOrderService', () => {
	let service: WorkOrderService
	let fakeRepo: WorkOrderRepo
	let fakeRecipeService: RecipeService
	let fakeInventoryService: InventoryServiceModule

	beforeEach(() => {
		fakeRepo = {
			getById: vi.fn(),
			getListPaginated: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
		} as any

		fakeRecipeService = {
			getById: vi.fn(),
			handleCalculateCost: vi.fn(),
		} as any

		fakeInventoryService = {
			transaction: {
				handleProductionOut: vi.fn(),
				handleProductionIn: vi.fn(),
			},
		} as any

		service = new WorkOrderService(fakeRecipeService, fakeInventoryService)

		// Replace private repo with mock
		;(service as any).repo = fakeRepo
	})

	describe('getById', () => {
		it('should return work order when found', async () => {
			const mockWorkOrder: dto.WorkOrderDto = {
				id: 1,
				recipeId: 1,
				locationId: 1,
				status: 'draft',
				plannedQty: '100',
				actualQty: null,
				totalCost: null,
				startedAt: null,
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(mockWorkOrder)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockWorkOrder)
		})

		it('should throw NotFoundError when work order not found', async () => {
			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			await expect(service.getById(999)).rejects.toThrow(
				new NotFoundError('Work Order with ID 999 not found', 'WORK_ORDER_NOT_FOUND')
			)
		})
	})

	describe('handleList', () => {
		it('should return paginated work orders', async () => {
			const filter: dto.WorkOrderFilterDto = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						recipeId: 1,
						locationId: 1,
						status: 'draft',
						plannedQty: '100',
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			vi.spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)

			const result = await service.handleList(filter)

			expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockPaginatedResult)
		})
	})

	describe('handleDetail', () => {
		it('should return work order detail', async () => {
			const mockWorkOrder: dto.WorkOrderDto = {
				id: 1,
				recipeId: 1,
				locationId: 1,
				status: 'draft',
				plannedQty: '100',
				actualQty: null,
				totalCost: null,
				startedAt: null,
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(mockWorkOrder)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockWorkOrder)
		})
	})

	describe('handleCreate', () => {
		it('should create work order successfully', async () => {
			const createData: dto.WorkOrderCreateDto = {
				recipeId: 1,
				locationId: 1,
				plannedQty: '100',
				note: 'Test work order',
			}

			const actorId = 1
			const mockWorkOrder: dto.WorkOrderDto = {
				id: 1,
				...createData,
				status: 'draft',
				actualQty: null,
				totalCost: null,
				startedAt: null,
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(mockWorkOrder)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual(mockWorkOrder)
		})
	})

	describe('handleStart', () => {
		it('should start work order successfully', async () => {
			const mockWorkOrder: dto.WorkOrderDto = {
				id: 1,
				recipeId: 1,
				locationId: 1,
				status: 'draft',
				plannedQty: '100',
				actualQty: null,
				totalCost: null,
				startedAt: null,
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1
			const updatedWorkOrder: dto.WorkOrderDto = {
				...mockWorkOrder,
				status: 'in_progress',
				startedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(mockWorkOrder)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(updatedWorkOrder)

			const result = await service.handleStart(1, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.update).toHaveBeenCalledWith(
				1,
				{ status: 'in_progress', startedAt: expect.any(Date) },
				actorId
			)
			expect(result).toEqual(updatedWorkOrder)
		})

		it('should throw ConflictError when work order is not draft', async () => {
			const mockWorkOrder: dto.WorkOrderDto = {
				id: 1,
				recipeId: 1,
				locationId: 1,
				status: 'in_progress',
				plannedQty: '100',
				actualQty: null,
				totalCost: null,
				startedAt: new Date(),
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(mockWorkOrder)

			await expect(service.handleStart(1, actorId)).rejects.toThrow(
				new ConflictError('Only draft Work Orders can be started')
			)

			expect(fakeRepo.update).not.toHaveBeenCalled()
		})
	})

	describe('handleComplete', () => {
		it('should complete work order successfully', async () => {
			const mockWorkOrder: dto.WorkOrderDto = {
				id: 1,
				recipeId: 1,
				locationId: 1,
				status: 'in_progress',
				plannedQty: '100',
				actualQty: null,
				totalCost: null,
				startedAt: new Date(),
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockRecipe = {
				id: 1,
				materialId: 10,
				targetQty: '100',
				items: [
					{
						materialId: 1,
						qty: '50',
						scrapPercentage: '5',
					},
					{
						materialId: 2,
						qty: '30',
						scrapPercentage: '10',
					},
				],
			}

			const mockCostResult = {
				totalCost: '1000',
				items: [],
			}

			const completeData: dto.WorkOrderCompleteDto = {
				actualQty: '95',
			}

			const actorId = 1

			const mockTransaction = vi.fn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			vi.spyOn(service, 'getById').mockResolvedValue(mockWorkOrder)
			vi.spyOn(fakeRecipeService, 'getById').mockResolvedValue(mockRecipe)
			vi.spyOn(fakeRecipeService, 'handleCalculateCost').mockResolvedValue(mockCostResult)
			vi.spyOn(fakeInventoryService.transaction, 'handleProductionOut').mockResolvedValue(undefined)
			vi.spyOn(fakeInventoryService.transaction, 'handleProductionIn').mockResolvedValue(undefined)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue({
				...mockWorkOrder,
				status: 'completed',
				actualQty: '95',
				totalCost: '950',
				completedAt: new Date(),
			})

			const result = await service.handleComplete(1, completeData, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRecipeService.getById).toHaveBeenCalledWith(1)
			expect(fakeRecipeService.handleCalculateCost).toHaveBeenCalledWith(1)
			expect(fakeInventoryService.transaction.handleProductionOut).toHaveBeenCalledWith(
				{
					locationId: 1,
					date: expect.any(Date),
					referenceNo: 'WO-OUT-1',
					notes: 'Consumed for Work Order #1',
					items: [
						{
							materialId: 1,
							qty: '52.5', // 50 * 0.95 * 1.05
						},
						{
							materialId: 2,
							qty: '31.35', // 30 * 0.95 * 1.10
						},
					],
				},
				actorId,
				expect.any(Object)
			)
			expect(fakeInventoryService.transaction.handleProductionIn).toHaveBeenCalledWith(
				{
					locationId: 1,
					date: expect.any(Date),
					referenceNo: 'WO-IN-1',
					notes: 'Produced from Work Order #1',
					items: [
						{
							materialId: 10,
							qty: '95',
							unitCost: '10', // 950 / 95
						},
					],
				},
				actorId,
				expect.any(Object)
			)
			expect(result).toEqual({
				...mockWorkOrder,
				status: 'completed',
				actualQty: '95',
				totalCost: '950',
				completedAt: expect.any(Date),
			})
		})

		it('should throw ConflictError when work order is not in progress', async () => {
			const mockWorkOrder: dto.WorkOrderDto = {
				id: 1,
				recipeId: 1,
				locationId: 1,
				status: 'draft',
				plannedQty: '100',
				actualQty: null,
				totalCost: null,
				startedAt: null,
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const completeData: dto.WorkOrderCompleteDto = {
				actualQty: '95',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(mockWorkOrder)

			await expect(service.handleComplete(1, completeData, actorId)).rejects.toThrow(
				new ConflictError('Work Order with ID 1 is not in progress', 'WORK_ORDER_STATUS_CONFLICT')
			)

			expect(fakeRecipeService.getById).not.toHaveBeenCalled()
			expect(fakeInventoryService.transaction.handleProductionOut).not.toHaveBeenCalled()
			expect(fakeInventoryService.transaction.handleProductionIn).not.toHaveBeenCalled()
		})

		it('should handle work order completion without recipe items', async () => {
			const mockWorkOrder: dto.WorkOrderDto = {
				id: 1,
				recipeId: 1,
				locationId: 1,
				status: 'in_progress',
				plannedQty: '100',
				actualQty: null,
				totalCost: null,
				startedAt: new Date(),
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockRecipe = {
				id: 1,
				materialId: 10,
				targetQty: '100',
				items: null,
			}

			const mockCostResult = {
				totalCost: '1000',
				items: [],
			}

			const completeData: dto.WorkOrderCompleteDto = {
				actualQty: '95',
			}

			const actorId = 1

			const mockTransaction = vi.fn().mockImplementation(async (callback) => {
				return await callback()
			})

			vi.mocked(db.transaction).mockImplementation(mockTransaction)
			vi.spyOn(service, 'getById').mockResolvedValue(mockWorkOrder)
			vi.spyOn(fakeRecipeService, 'getById').mockResolvedValue(mockRecipe)
			vi.spyOn(fakeRecipeService, 'handleCalculateCost').mockResolvedValue(mockCostResult)
			vi.spyOn(fakeInventoryService.transaction, 'handleProductionIn').mockResolvedValue(undefined)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue({
				...mockWorkOrder,
				status: 'completed',
				actualQty: '95',
				totalCost: '950',
				completedAt: new Date(),
			})

			await service.handleComplete(1, completeData, actorId)

			expect(fakeInventoryService.transaction.handleProductionOut).not.toHaveBeenCalled()
			expect(fakeInventoryService.transaction.handleProductionIn).toHaveBeenCalled()
		})
	})
})
