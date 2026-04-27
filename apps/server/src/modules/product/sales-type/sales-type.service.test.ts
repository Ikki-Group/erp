import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SalesTypeService } from './sales-type.service'
import { SalesTypeRepo } from './sales-type.repo'
import { NotFoundError } from '@/core/http/errors'
import * as dto from './sales-type.dto'

describe('SalesTypeService', () => {
	let service: SalesTypeService
	let fakeRepo: SalesTypeRepo

	beforeEach(() => {
		fakeRepo = {
			getById: vi.fn(),
			getAll: vi.fn(),
			getListPaginated: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			seed: vi.fn(),
		} as any

		service = new SalesTypeService(fakeRepo)
	})

	describe('getById', () => {
		it('should return sales type when found', async () => {
			const mockSalesType: dto.SalesTypeDto = {
				id: 1,
				name: 'Retail',
				description: 'Retail sales type',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(mockSalesType)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockSalesType)
		})

		it('should throw NotFoundError when sales type not found', async () => {
			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			await expect(service.getById(999)).rejects.toThrow(
				new NotFoundError('Sales type with ID 999 not found', 'SALES_TYPE_NOT_FOUND')
			)
		})
	})

	describe('find', () => {
		it('should return all sales types', async () => {
			const mockSalesTypes: dto.SalesTypeDto[] = [
				{
					id: 1,
					name: 'Retail',
					description: 'Retail sales type',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					name: 'Wholesale',
					description: 'Wholesale sales type',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]

			vi.spyOn(fakeRepo, 'getAll').mockResolvedValue(mockSalesTypes)

			const result = await service.find()

			expect(fakeRepo.getAll).toHaveBeenCalled()
			expect(result).toEqual(mockSalesTypes)
		})
	})

	describe('handleList', () => {
		it('should return paginated list', async () => {
			const filter = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						name: 'Retail',
						description: 'Retail sales type',
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
		it('should return sales type detail', async () => {
			const mockSalesType: dto.SalesTypeDto = {
				id: 1,
				name: 'Retail',
				description: 'Retail sales type',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(mockSalesType)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockSalesType)
		})
	})

	describe('handleCreate', () => {
		it('should create sales type successfully', async () => {
			const createData: dto.SalesTypeCreateDto = {
				name: 'Online',
				description: 'Online sales type',
			}

			const actorId = 1
			const newSalesTypeId = 123

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(newSalesTypeId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual({ id: newSalesTypeId })
		})
	})

	describe('handleUpdate', () => {
		it('should update sales type successfully', async () => {
			const updateData: Partial<SalesTypeUpdateDto> = {
				name: 'Updated Retail',
				description: 'Updated description',
			}

			const actorId = 1
			const salesTypeId = 1

			vi.spyOn(fakeRepo, 'update').mockResolvedValue(salesTypeId)

			const result = await service.handleUpdate(salesTypeId, updateData, actorId)

			expect(fakeRepo.update).toHaveBeenCalledWith(salesTypeId, updateData, actorId)
			expect(result).toEqual({ id: salesTypeId })
		})
	})

	describe('handleRemove', () => {
		it('should delete sales type', async () => {
			const salesTypeId = 1

			vi.spyOn(fakeRepo, 'delete').mockResolvedValue(salesTypeId)

			const result = await service.handleRemove(salesTypeId)

			expect(fakeRepo.delete).toHaveBeenCalledWith(salesTypeId)
			expect(result).toEqual({ id: salesTypeId })
		})
	})

	describe('seed', () => {
		it('should seed sales types', async () => {
			const seedData = [
				{ name: 'Retail', description: 'Retail sales', createdBy: 1 },
				{ name: 'Wholesale', description: 'Wholesale sales', createdBy: 1 },
			] as any

			await service.seed(seedData)

			expect(fakeRepo.seed).toHaveBeenCalledWith(seedData)
		})
	})
})
