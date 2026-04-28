import { NotFoundError, ConflictError } from '@/core/http/errors'

import { LocationMasterService } from '@/modules/location'

import { MaterialService } from '../material-master/material.service'
import * as dto from './material-location.dto'
import { MaterialLocationRepo } from './material-location.repo'
import { MaterialLocationService } from './material-location.service'
import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

describe('MaterialLocationService', () => {
	let service: MaterialLocationService
	let fakeRepo: MaterialLocationRepo
	let fakeMaterialService: MaterialService
	let fakeLocationService: LocationMasterService

	beforeEach(() => {
		fakeRepo = {
			getOne: spyOn(),
			getByMaterialId: spyOn(),
			getByLocationId: spyOn(),
			batchAssign: spyOn(),
			unassign: spyOn(),
			getLocationsByMaterial: spyOn(),
			getStockByLocationPaginated: spyOn(),
			updateConfig: spyOn(),
			updateCurrentStock: spyOn(),
		} as any

		fakeMaterialService = {
			getById: spyOn(),
		} as any

		fakeLocationService = {
			getById: spyOn(),
		} as any

		service = new MaterialLocationService(fakeMaterialService, fakeLocationService, fakeRepo)
	})

	describe('findOne', () => {
		it('should return material-location assignment when found', async () => {
			const mockAssignment: dto.MaterialLocationDto = {
				id: 1,
				materialId: 1,
				locationId: 1,
				minStock: 10,
				maxStock: 100,
				reorderPoint: 20,
				currentQty: 50,
				currentAvgCost: 10,
				currentValue: 500,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'getOne').mockResolvedValue(mockAssignment)

			const result = await service.findOne(1, 1)

			expect(fakeRepo.getOne).toHaveBeenCalledWith(1, 1)
			expect(result).toEqual(mockAssignment)
		})

		it('should throw NotFoundError when assignment not found', async () => {
			spyOn(fakeRepo, 'getOne').mockResolvedValue(undefined)

			await expect(service.findOne(1, 1)).rejects.toThrow(
				new NotFoundError(
					'Material 1 is not assigned to location 1',
					'MATERIAL_NOT_ASSIGNED_TO_LOCATION',
				),
			)
		})
	})

	describe('findByMaterialId', () => {
		it('should return all assignments for material', async () => {
			const mockAssignments: dto.MaterialLocationDto[] = [
				{
					id: 1,
					materialId: 1,
					locationId: 1,
					minStock: 10,
					maxStock: 100,
					reorderPoint: 20,
					currentQty: 50,
					currentAvgCost: 10,
					currentValue: 500,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]

			spyOn(fakeRepo, 'getByMaterialId').mockResolvedValue(mockAssignments)

			const result = await service.findByMaterialId(1)

			expect(fakeRepo.getByMaterialId).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockAssignments)
		})
	})

	describe('findByLocationId', () => {
		it('should return all assignments for location', async () => {
			const mockAssignments: dto.MaterialLocationDto[] = [
				{
					id: 1,
					materialId: 1,
					locationId: 1,
					minStock: 10,
					maxStock: 100,
					reorderPoint: 20,
					currentQty: 50,
					currentAvgCost: 10,
					currentValue: 500,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]

			spyOn(fakeRepo, 'getByLocationId').mockResolvedValue(mockAssignments)

			const result = await service.findByLocationId(1)

			expect(fakeRepo.getByLocationId).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockAssignments)
		})
	})

	describe('handleAssign', () => {
		it('should assign materials to locations successfully', async () => {
			const assignData: dto.MaterialLocationAssignDto = {
				materialIds: [1, 2],
				locationIds: [1, 2],
			}

			const actorId = 1
			const assignedCount = 4

			spyOn(fakeLocationService, 'getById').mockResolvedValue({ id: 1 } as any)
			spyOn(fakeMaterialService, 'getById').mockResolvedValue({ id: 1 } as any)
			spyOn(fakeRepo, 'batchAssign').mockResolvedValue(assignedCount)

			const result = await service.handleAssign(assignData, actorId)

			expect(fakeLocationService.getById).toHaveBeenCalledWith(1)
			expect(fakeLocationService.getById).toHaveBeenCalledWith(2)
			expect(fakeMaterialService.getById).toHaveBeenCalledWith(1)
			expect(fakeMaterialService.getById).toHaveBeenCalledWith(2)
			expect(fakeRepo.batchAssign).toHaveBeenCalledWith([1, 2], [1, 2], actorId)
			expect(result).toEqual({ assignedCount })
		})
	})

	describe('handleUnassign', () => {
		it('should unassign material from location successfully', async () => {
			const unassignData: dto.MaterialLocationUnassignDto = {
				materialId: 1,
				locationId: 1,
			}

			const resultId = 1

			spyOn(fakeRepo, 'unassign').mockResolvedValue(resultId)

			const result = await service.handleUnassign(unassignData)

			expect(fakeRepo.unassign).toHaveBeenCalledWith(1, 1)
			expect(result).toEqual({ id: resultId })
		})

		it('should throw NotFoundError when assignment not found', async () => {
			const unassignData: dto.MaterialLocationUnassignDto = {
				materialId: 1,
				locationId: 1,
			}

			spyOn(fakeRepo, 'unassign').mockResolvedValue(undefined)

			await expect(service.handleUnassign(unassignData)).rejects.toThrow(
				new NotFoundError(
					'Material 1 is not assigned to location 1',
					'MATERIAL_NOT_ASSIGNED_TO_LOCATION',
				),
			)
		})
	})

	describe('handleLocationsByMaterial', () => {
		it('should return locations for material with enriched data', async () => {
			const materialId = 1
			const mockLocations: dto.MaterialLocationWithLocationDto[] = [
				{
					id: 1,
					materialId: 1,
					locationId: 1,
					minStock: 10,
					maxStock: 100,
					reorderPoint: 20,
					currentQty: 50,
					currentAvgCost: 10,
					currentValue: 500,
					createdAt: new Date(),
					updatedAt: new Date(),
					location: {
						id: 1,
						name: 'Warehouse 1',
						code: 'WH1',
						type: 'warehouse',
					},
				},
			]

			spyOn(fakeMaterialService, 'getById').mockResolvedValue({ id: 1 } as any)
			spyOn(fakeRepo, 'getLocationsByMaterial').mockResolvedValue(mockLocations)

			const result = await service.handleLocationsByMaterial(materialId)

			expect(fakeMaterialService.getById).toHaveBeenCalledWith(materialId)
			expect(fakeRepo.getLocationsByMaterial).toHaveBeenCalledWith(materialId)
			expect(result).toEqual(mockLocations)
		})
	})

	describe('handleStockByLocation', () => {
		it('should return stock data for location', async () => {
			const filter: dto.MaterialLocationFilterDto = {
				locationId: 1,
				page: 1,
				limit: 10,
			}

			const mockStockData: dto.MaterialLocationStockDto[] = [
				{
					id: 1,
					materialId: 1,
					locationId: 1,
					minStock: 10,
					maxStock: 100,
					reorderPoint: 20,
					currentQty: 50,
					currentAvgCost: 10,
					currentValue: 500,
					createdAt: new Date(),
					updatedAt: new Date(),
					material: {
						id: 1,
						sku: 'MAT-001',
						name: 'Test Material',
						description: 'Test',
					},
				},
			]

			const mockPaginatedResult = {
				data: mockStockData,
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			spyOn(fakeLocationService, 'getById').mockResolvedValue({ id: 1 } as any)
			spyOn(fakeRepo, 'getStockByLocationPaginated').mockResolvedValue(mockPaginatedResult)

			const result = await service.handleStockByLocation(filter)

			expect(fakeLocationService.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.getStockByLocationPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockPaginatedResult)
		})
	})

	describe('handleUpdateConfig', () => {
		it('should update config successfully', async () => {
			const configData: dto.MaterialLocationConfigDto = {
				id: 1,
				minStock: 15,
				maxStock: 150,
				reorderPoint: 25,
			}

			const actorId = 1
			const resultId = 1

			spyOn(fakeRepo, 'updateConfig').mockResolvedValue(resultId)

			const result = await service.handleUpdateConfig(configData, actorId)

			expect(fakeRepo.updateConfig).toHaveBeenCalledWith(
				1,
				{ minStock: 15, maxStock: 150, reorderPoint: 25 },
				actorId,
			)
			expect(result).toEqual({ id: resultId })
		})

		it('should throw NotFoundError when assignment not found', async () => {
			const configData: dto.MaterialLocationConfigDto = {
				id: 999,
				minStock: 15,
				maxStock: 150,
				reorderPoint: 25,
			}

			const actorId = 1

			spyOn(fakeRepo, 'updateConfig').mockResolvedValue(undefined)

			await expect(service.handleUpdateConfig(configData, actorId)).rejects.toThrow(
				new NotFoundError(
					'Material-Location assignment with ID 999 not found',
					'MATERIAL_LOCATION_NOT_FOUND',
				),
			)
		})
	})

	describe('updateCurrentStock', () => {
		it('should update current stock', async () => {
			const materialId = 1
			const locationId = 1
			const stockData = {
				currentQty: 100,
				currentAvgCost: 12,
				currentValue: 1200,
			}
			const actorId = 1

			await service.updateCurrentStock(materialId, locationId, stockData, actorId)

			expect(fakeRepo.updateCurrentStock).toHaveBeenCalledWith(
				materialId,
				locationId,
				stockData,
				actorId,
				undefined,
			)
		})

		it('should update current stock with transaction', async () => {
			const materialId = 1
			const locationId = 1
			const stockData = {
				currentQty: 100,
				currentAvgCost: 12,
				currentValue: 1200,
			}
			const actorId = 1
			const mockTx = {} as any

			await service.updateCurrentStock(materialId, locationId, stockData, actorId, mockTx)

			expect(fakeRepo.updateCurrentStock).toHaveBeenCalledWith(
				materialId,
				locationId,
				stockData,
				actorId,
				mockTx,
			)
		})
	})
})
