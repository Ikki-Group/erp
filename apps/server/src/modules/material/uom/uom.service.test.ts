import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UomService } from './uom.service'
import { UomRepo } from './uom.repo'
import { NotFoundError, InternalServerError } from '@/core/http/errors'
import * as dto from './uom.dto'

describe('UomService', () => {
	let service: UomService
	let fakeRepo: UomRepo

	beforeEach(() => {
		fakeRepo = {
			getList: vi.fn(),
			getById: vi.fn(),
			count: vi.fn(),
			getListPaginated: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			remove: vi.fn(),
			hardRemove: vi.fn(),
			seed: vi.fn(),
		} as any

		service = new UomService(fakeRepo)
	})

	describe('find', () => {
		it('should return all UOMs', async () => {
			const mockUoms: dto.UomDto[] = [
				{
					id: 1,
					code: 'KG',
					description: 'Kilogram',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					code: 'L',
					description: 'Liter',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]

			vi.spyOn(fakeRepo, 'getList').mockResolvedValue(mockUoms)

			const result = await service.find()

			expect(fakeRepo.getList).toHaveBeenCalled()
			expect(result).toEqual(mockUoms)
		})
	})

	describe('getById', () => {
		it('should return UOM when found', async () => {
			const mockUom: dto.UomDto = {
				id: 1,
				code: 'KG',
				description: 'Kilogram',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(mockUom)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockUom)
		})

		it('should throw NotFoundError when UOM not found', async () => {
			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			await expect(service.getById(999)).rejects.toThrow(
				new NotFoundError('UOM with ID 999 not found', 'UOM_NOT_FOUND')
			)
		})
	})

	describe('count', () => {
		it('should return UOM count', async () => {
			const mockCount = 5

			vi.spyOn(fakeRepo, 'count').mockResolvedValue(mockCount)

			const result = await service.count()

			expect(fakeRepo.count).toHaveBeenCalled()
			expect(result).toBe(mockCount)
		})
	})

	describe('seed', () => {
		it('should seed UOMs', async () => {
			const seedData = [
				{ code: 'KG', createdBy: 1 },
				{ code: 'L', createdBy: 1 },
			]

			await service.seed(seedData)

			expect(fakeRepo.seed).toHaveBeenCalledWith(seedData)
		})
	})

	describe('handleList', () => {
		it('should return paginated list', async () => {
			const filter = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						code: 'KG',
						description: 'Kilogram',
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
		it('should return UOM detail', async () => {
			const mockUom: dto.UomDto = {
				id: 1,
				code: 'KG',
				description: 'Kilogram',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(mockUom)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockUom)
		})
	})

	describe('handleCreate', () => {
		it('should create UOM successfully', async () => {
			const createData: dto.UomMutationDto = {
				code: '  ton  ',
				description: 'Metric ton',
			}

			const actorId = 1
			const newUomId = 123

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(newUomId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(
				{ code: 'TON', createdBy: actorId },
				actorId
			)
			expect(result).toEqual({ id: newUomId })
		})

		it('should convert code to uppercase and trim whitespace', async () => {
			const createData: dto.UomMutationDto = {
				code: '  kg  ',
				description: 'Kilogram',
			}

			const actorId = 1
			const newUomId = 124

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(newUomId)

			await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(
				{ code: 'KG', createdBy: actorId },
				actorId
			)
		})

		it('should throw InternalServerError when create fails', async () => {
			const createData: dto.UomMutationDto = {
				code: 'FAIL',
				description: 'Failed UOM',
			}

			const actorId = 1

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(undefined)

			await expect(service.handleCreate(createData, actorId)).rejects.toThrow(
				new InternalServerError('UOM creation failed', 'UOM_CREATE_FAILED')
			)
		})
	})

	describe('handleUpdate', () => {
		it('should update UOM successfully', async () => {
			const existingUom: dto.UomDto = {
				id: 1,
				code: 'KG',
				description: 'Kilogram',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: Partial<dto.UomMutationDto> = {
				code: '  lb  ',
				description: 'Pound',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingUom)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const result = await service.handleUpdate(1, updateData, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.update).toHaveBeenCalledWith(
				1,
				{ code: 'LB', updatedBy: actorId },
				actorId
			)
			expect(result).toEqual({ id: 1 })
		})

		it('should use existing code when update data does not include code', async () => {
			const existingUom: dto.UomDto = {
				id: 1,
				code: 'KG',
				description: 'Kilogram',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: Partial<dto.UomMutationDto> = {
				description: 'Updated Description Only',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingUom)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(1)

			await service.handleUpdate(1, updateData, actorId)

			expect(fakeRepo.update).toHaveBeenCalledWith(
				1,
				{ code: 'KG', updatedBy: actorId },
				actorId
			)
		})

		it('should throw NotFoundError when update returns falsy', async () => {
			const existingUom: dto.UomDto = {
				id: 1,
				code: 'KG',
				description: 'Kilogram',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: Partial<dto.UomMutationDto> = {
				description: 'Failed Update',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingUom)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(undefined)

			await expect(service.handleUpdate(1, updateData, actorId)).rejects.toThrow(
				new NotFoundError('UOM with ID 1 not found', 'UOM_NOT_FOUND')
			)
		})
	})

	describe('handleRemove', () => {
		it('should remove UOM successfully', async () => {
			const existingUom: dto.UomDto = {
				id: 1,
				code: 'KG',
				description: 'Kilogram',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingUom)
			vi.spyOn(fakeRepo, 'remove').mockResolvedValue(1)

			const result = await service.handleRemove(1, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.remove).toHaveBeenCalledWith(1, actorId)
			expect(result).toEqual({ id: 1 })
		})

		it('should throw NotFoundError when removing non-existent UOM', async () => {
			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleRemove(999, actorId)).rejects.toThrow(
				new NotFoundError('UOM with ID 999 not found', 'UOM_NOT_FOUND')
			)
		})

		it('should throw NotFoundError when remove returns falsy', async () => {
			const existingUom: dto.UomDto = {
				id: 1,
				code: 'KG',
				description: 'Kilogram',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingUom)
			vi.spyOn(fakeRepo, 'remove').mockResolvedValue(undefined)

			await expect(service.handleRemove(1, actorId)).rejects.toThrow(
				new NotFoundError('UOM with ID 1 not found', 'UOM_NOT_FOUND')
			)
		})
	})

	describe('handleHardRemove', () => {
		it('should hard remove UOM successfully', async () => {
			vi.spyOn(fakeRepo, 'hardRemove').mockResolvedValue(1)

			const result = await service.handleHardRemove(1)

			expect(fakeRepo.hardRemove).toHaveBeenCalledWith(1)
			expect(result).toEqual({ id: 1 })
		})

		it('should throw NotFoundError when hard remove returns falsy', async () => {
			vi.spyOn(fakeRepo, 'hardRemove').mockResolvedValue(undefined)

			await expect(service.handleHardRemove(999)).rejects.toThrow(
				new NotFoundError('UOM with ID 999 not found', 'UOM_NOT_FOUND')
			)
		})
	})
})
