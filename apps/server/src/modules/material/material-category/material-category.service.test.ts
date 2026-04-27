import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MaterialCategoryService } from './material-category.service'
import { MaterialCategoryRepo } from './material-category.repo'
import { NotFoundError, InternalServerError } from '@/core/http/errors'
import * as dto from './material-category.dto'

describe('MaterialCategoryService', () => {
	let service: MaterialCategoryService
	let fakeRepo: MaterialCategoryRepo

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
		} as any

		service = new MaterialCategoryService(fakeRepo)
	})

	describe('find', () => {
		it('should return all categories', async () => {
			const mockCategories: dto.MaterialCategoryDto[] = [
				{
					id: 1,
					name: 'Raw Materials',
					description: 'Raw material categories',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					name: 'Finished Goods',
					description: 'Finished product categories',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]

			vi.spyOn(fakeRepo, 'getList').mockResolvedValue(mockCategories)

			const result = await service.find()

			expect(fakeRepo.getList).toHaveBeenCalled()
			expect(result).toEqual(mockCategories)
		})
	})

	describe('getById', () => {
		it('should return category when found', async () => {
			const mockCategory: dto.MaterialCategoryDto = {
				id: 1,
				name: 'Raw Materials',
				description: 'Raw material categories',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(mockCategory)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockCategory)
		})

		it('should return undefined when not found', async () => {
			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			const result = await service.getById(999)

			expect(result).toBeUndefined()
		})
	})

	describe('count', () => {
		it('should return category count', async () => {
			const mockCount = 5

			vi.spyOn(fakeRepo, 'count').mockResolvedValue(mockCount)

			const result = await service.count()

			expect(fakeRepo.count).toHaveBeenCalled()
			expect(result).toBe(mockCount)
		})
	})

	describe('handleList', () => {
		it('should return paginated list', async () => {
			const filter = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						name: 'Raw Materials',
						description: 'Raw material categories',
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
		it('should return category detail when found', async () => {
			const mockCategory: dto.MaterialCategoryDto = {
				id: 1,
				name: 'Raw Materials',
				description: 'Raw material categories',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(mockCategory)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockCategory)
		})

		it('should throw NotFoundError when category not found', async () => {
			vi.spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleDetail(999)).rejects.toThrow(
				new NotFoundError('Material category with ID 999 not found', 'MATERIAL_CATEGORY_NOT_FOUND')
			)
		})
	})

	describe('handleCreate', () => {
		it('should create category successfully', async () => {
			const createData: dto.MaterialCategoryCreateDto = {
				name: '  New Category  ',
				description: 'New Description',
			}

			const actorId = 1
			const newCategoryId = 123

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(newCategoryId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(
				{ ...createData, name: 'New Category', createdBy: actorId },
				actorId
			)
			expect(result).toEqual({ id: newCategoryId })
		})

		it('should trim whitespace from name', async () => {
			const createData: dto.MaterialCategoryCreateDto = {
				name: '  Trimmed Name  ',
				description: 'Description',
			}

			const actorId = 1
			const newCategoryId = 124

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(newCategoryId)

			await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(
				{ ...createData, name: 'Trimmed Name', createdBy: actorId },
				actorId
			)
		})
	})

	describe('handleUpdate', () => {
		it('should update category successfully', async () => {
			const existingCategory: dto.MaterialCategoryDto = {
				id: 1,
				name: 'Old Name',
				description: 'Old Description',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: Partial<MaterialCategoryUpdateDto> = {
				name: '  Updated Name  ',
				description: 'Updated Description',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingCategory)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const result = await service.handleUpdate(1, updateData, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.update).toHaveBeenCalledWith(
				1,
				{ ...updateData, name: 'Updated Name', updatedBy: actorId },
				actorId
			)
			expect(result).toEqual({ id: 1 })
		})

		it('should throw NotFoundError when updating non-existent category', async () => {
			const updateData: Partial<MaterialCategoryUpdateDto> = {
				name: 'Updated Name',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleUpdate(999, updateData, actorId)).rejects.toThrow(
				new NotFoundError('Material category with ID 999 not found', 'MATERIAL_CATEGORY_NOT_FOUND')
			)
		})

		it('should use existing name when update data does not include name', async () => {
			const existingCategory: dto.MaterialCategoryDto = {
				id: 1,
				name: 'Existing Name',
				description: 'Existing Description',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: Partial<MaterialCategoryUpdateDto> = {
				description: 'Updated Description Only',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingCategory)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(1)

			await service.handleUpdate(1, updateData, actorId)

			expect(fakeRepo.update).toHaveBeenCalledWith(
				1,
				{ ...updateData, name: 'Existing Name', updatedBy: actorId },
				actorId
			)
		})
	})

	describe('handleRemove', () => {
		it('should remove category successfully', async () => {
			const existingCategory: dto.MaterialCategoryDto = {
				id: 1,
				name: 'To Remove',
				description: 'Remove this',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingCategory)
			vi.spyOn(fakeRepo, 'remove').mockResolvedValue(1)

			const result = await service.handleRemove(1, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.remove).toHaveBeenCalledWith(1, actorId)
			expect(result).toEqual({ id: 1 })
		})

		it('should throw NotFoundError when removing non-existent category', async () => {
			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleRemove(999, actorId)).rejects.toThrow(
				new NotFoundError('Material category with ID 999 not found', 'MATERIAL_CATEGORY_NOT_FOUND')
			)
		})

		it('should throw NotFoundError when remove returns falsy', async () => {
			const existingCategory: dto.MaterialCategoryDto = {
				id: 1,
				name: 'Failed Remove',
				description: 'This will fail',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingCategory)
			vi.spyOn(fakeRepo, 'remove').mockResolvedValue(undefined)

			await expect(service.handleRemove(1, actorId)).rejects.toThrow(
				new NotFoundError('Material category with ID 1 not found', 'MATERIAL_CATEGORY_NOT_FOUND')
			)
		})
	})

	describe('handleHardRemove', () => {
		it('should hard remove category successfully', async () => {
			const existingCategory: dto.MaterialCategoryDto = {
				id: 1,
				name: 'Hard Remove',
				description: 'Hard remove this',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(existingCategory)
			vi.spyOn(fakeRepo, 'hardRemove').mockResolvedValue(1)

			const result = await service.handleHardRemove(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.hardRemove).toHaveBeenCalledWith(1)
			expect(result).toEqual({ id: 1 })
		})

		it('should throw NotFoundError when hard removing non-existent category', async () => {
			vi.spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleHardRemove(999)).rejects.toThrow(
				new NotFoundError('Material category with ID 999 not found', 'MATERIAL_CATEGORY_NOT_FOUND')
			)
		})
	})
})
