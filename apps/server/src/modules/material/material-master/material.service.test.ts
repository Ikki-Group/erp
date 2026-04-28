import { LocationMasterService } from '@/modules/location'

import { MaterialCategoryService } from '../material-category/material-category.service'
import { MaterialLocationRepo } from '../material-location/material-location.repo'
import { UomService } from '../uom/uom.service'
import * as dto from './material.dto'
import { MaterialRepo } from './material.repo'
import { MaterialService } from './material.service'
import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

describe('MaterialService', () => {
	let service: MaterialService
	let fakeRepo: MaterialRepo
	let fakeLocationRepo: MaterialLocationRepo
	let fakeCategoryService: MaterialCategoryService
	let fakeUomService: UomService
	let fakeLocationService: LocationMasterService

	beforeEach(() => {
		fakeRepo = {
			getById: spyOn(),
			getListPaginated: spyOn(),
			create: spyOn(),
			update: spyOn(),
			remove: spyOn(),
		} as any

		fakeLocationRepo = {
			getByMaterialId: spyOn(),
		} as any

		fakeCategoryService = {
			handleList: spyOn(),
			getById: spyOn(),
		} as any

		fakeUomService = {
			handleList: spyOn(),
			getById: spyOn(),
		} as any

		fakeLocationService = {
			location: {
				handleList: spyOn(),
				getById: spyOn(),
			},
		} as any

		service = new MaterialService(
			fakeCategoryService,
			fakeUomService,
			fakeLocationService,
			fakeRepo,
			fakeLocationRepo,
		)
	})

	describe('getMaterialWithRelations', () => {
		it('should throw error when material not found', async () => {
			spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			await expect((service as any).getMaterialWithRelations(999)).rejects.toThrow(
				'Material with ID 999 not found',
			)
		})
	})

	describe('handleList', () => {
		it('should return paginated list with enriched data', async () => {
			const filter = { page: 1, limit: 10 }
			const mockMaterials: dto.MaterialDto[] = [
				{
					id: 1,
					sku: 'MAT-001',
					name: 'Test Material',
					description: 'Test Description',
					baseUomId: 1,
					categoryId: 1,
					conversions: [],
					locationIds: [1, 2],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]

			const mockPaginatedResult = {
				data: mockMaterials,
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)
			spyOn(fakeCategoryService, 'handleList').mockResolvedValue({
				data: [{ id: 1, name: 'Test Category' }],
				meta: { page: 1, limit: 1000, total: 1, totalPages: 1 },
			})
			spyOn(fakeUomService, 'handleList').mockResolvedValue({
				data: [{ id: 1, name: 'KG' }],
				meta: { page: 1, limit: 1000, total: 1, totalPages: 1 },
			})
			spyOn(fakeLocationService.location, 'handleList').mockResolvedValue({
				data: [
					{ id: 1, name: 'Warehouse 1' },
					{ id: 2, name: 'Warehouse 2' },
				],
				meta: { page: 1, limit: 1000, total: 2, totalPages: 1 },
			})

			// Mock the private method
			spyOn(service as any, 'getMaterialsBatchWithRelations').mockResolvedValue(
				new Map([[1, { conversions: [], locationIds: [1, 2] }]]),
			)

			const result = await service.handleList(filter)

			expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
			expect(result.data[0]).toHaveProperty('category')
			expect(result.data[0]).toHaveProperty('baseUom')
			expect(result.data[0]).toHaveProperty('locations')
		})
	})

	describe('handleDetail', () => {
		it('should return material detail with enriched data', async () => {
			const mockMaterial: dto.MaterialDto = {
				id: 1,
				sku: 'MAT-001',
				name: 'Test Material',
				description: 'Test Description',
				baseUomId: 1,
				categoryId: 1,
				conversions: [],
				locationIds: [1, 2],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(service as any, 'getMaterialWithRelations').mockResolvedValue(mockMaterial)
			spyOn(fakeCategoryService, 'getById').mockResolvedValue({
				id: 1,
				name: 'Test Category',
				description: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			spyOn(fakeUomService, 'getById').mockResolvedValue({
				id: 1,
				name: 'KG',
				description: 'Kilogram',
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			spyOn(fakeLocationService.location, 'handleList').mockResolvedValue({
				data: [
					{ id: 1, name: 'Warehouse 1' },
					{ id: 2, name: 'Warehouse 2' },
				],
				meta: { page: 1, limit: 1000, total: 2, totalPages: 1 },
			})

			const result = await service.handleDetail(1)

			expect((service as any).getMaterialWithRelations).toHaveBeenCalledWith(1)
			expect(result).toHaveProperty('category')
			expect(result).toHaveProperty('baseUom')
			expect(result).toHaveProperty('locations')
		})
	})

	describe('handleCreate', () => {
		it('should create material successfully', async () => {
			const createData: dto.MaterialMutationDto = {
				sku: 'NEW-001',
				name: 'New Material',
				description: 'New Description',
				baseUomId: 1,
				categoryId: 1,
				conversions: [],
				locationIds: [1],
			}

			const actorId = 1
			const newMaterialId = 123

			spyOn(fakeRepo, 'create').mockResolvedValue(newMaterialId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual({ id: newMaterialId })
		})

		it('should throw error if create fails', async () => {
			const createData: dto.MaterialMutationDto = {
				sku: 'FAIL-001',
				name: 'Fail Material',
				description: 'Fail Description',
				baseUomId: 1,
				categoryId: 1,
				conversions: [],
				locationIds: [1],
			}

			const actorId = 1

			spyOn(fakeRepo, 'create').mockResolvedValue(undefined)

			await expect(service.handleCreate(createData, actorId)).rejects.toThrow(
				'Material creation failed',
			)
		})
	})

	describe('handleUpdate', () => {
		it('should update material successfully', async () => {
			const existingMaterial: dto.MaterialDto = {
				id: 1,
				sku: 'OLD-001',
				name: 'Old Material',
				description: 'Old Description',
				baseUomId: 1,
				categoryId: 1,
				conversions: [],
				locationIds: [1],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: dto.MaterialMutationDto = {
				sku: 'UPDATED-001',
				name: 'Updated Material',
				description: 'Updated Description',
				baseUomId: 2,
				categoryId: 2,
				conversions: [],
				locationIds: [1, 2],
			}

			const actorId = 1

			spyOn(service as any, 'getMaterialWithRelations').mockResolvedValue(existingMaterial)
			spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const result = await service.handleUpdate(1, updateData, actorId)

			expect((service as any).getMaterialWithRelations).toHaveBeenCalledWith(1)
			expect(fakeRepo.update).toHaveBeenCalledWith(1, updateData, actorId)
			expect(result).toEqual({ id: 1 })
		})
	})

	describe('handleRemove', () => {
		it('should remove material successfully', async () => {
			const existingMaterial: dto.MaterialDto = {
				id: 1,
				sku: 'DELETE-001',
				name: 'Delete Material',
				description: 'Delete Description',
				baseUomId: 1,
				categoryId: 1,
				conversions: [],
				locationIds: [1],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1

			spyOn(service as any, 'getMaterialWithRelations').mockResolvedValue(existingMaterial)
			spyOn(fakeRepo, 'remove').mockResolvedValue(1)

			const result = await service.handleRemove(1, actorId)

			expect((service as any).getMaterialWithRelations).toHaveBeenCalledWith(1)
			expect(fakeRepo.remove).toHaveBeenCalledWith(1, actorId)
			expect(result).toEqual({ id: 1 })
		})
	})
})
