import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { ProductCategoryService } from './product-category.service'
import { ProductCategoryRepo } from './product-category.repo'
import { NotFoundError } from '@/core/http/errors'
import * as dto from './product-category.dto'

describe('ProductCategoryService', () => {
	let service: ProductCategoryService
	let fakeRepo: ProductCategoryRepo

	beforeEach(() => {
		fakeRepo = {
			getById: spyOn(),
			getListPaginated: spyOn(),
			create: spyOn(),
			update: spyOn(),
			softDelete: spyOn(),
			hardDelete: spyOn(),
		} as any

		service = new ProductCategoryService(fakeRepo)
	})

	describe('getById', () => {
		it('should return category when found', async () => {
			const mockCategory: dto.ProductCategoryDto = {
				id: 1,
				name: 'Test Category',
				description: 'Test Description',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(fakeRepo, 'getById').mockResolvedValue(mockCategory)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockCategory)
		})

		it('should throw NotFoundError when category not found', async () => {
			spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			await expect(service.getById(999)).rejects.toThrow(
				new NotFoundError('Product category with ID 999 not found', 'PRODUCT_CATEGORY_NOT_FOUND')
			)
		})
	})

	describe('handleList', () => {
		it('should return paginated list', async () => {
			const filter = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						name: 'Test Category',
						description: 'Test Description',
						createdAt: new Date(),
						updatedAt: new Date(),
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
		it('should return category detail', async () => {
			const mockCategory: dto.ProductCategoryDto = {
				id: 1,
				name: 'Test Category',
				description: 'Test Description',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(service, 'getById').mockResolvedValue(mockCategory)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockCategory)
		})
	})

	describe('handleCreate', () => {
		it('should create category successfully', async () => {
			const createData: dto.ProductCategoryCreateDto = {
				name: 'New Category',
				description: 'New Description',
			}

			const actorId = 1
			const newCategoryId = 123

			spyOn(fakeRepo, 'create').mockResolvedValue(newCategoryId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual({ id: newCategoryId })
		})
	})

	describe('handleUpdate', () => {
		it('should update category successfully', async () => {
			const updateData: dto.ProductCategoryUpdateDto = {
				name: 'Updated Category',
				description: 'Updated Description',
			}

			const actorId = 1
			const categoryId = 1

			spyOn(fakeRepo, 'update').mockResolvedValue(categoryId)

			const result = await service.handleUpdate(categoryId, updateData, actorId)

			expect(fakeRepo.update).toHaveBeenCalledWith(categoryId, updateData, actorId)
			expect(result).toEqual({ id: categoryId })
		})
	})

	describe('handleRemove', () => {
		it('should soft delete category', async () => {
			const categoryId = 1
			const actorId = 1

			spyOn(fakeRepo, 'softDelete').mockResolvedValue(categoryId)

			const result = await service.handleRemove(categoryId, actorId)

			expect(fakeRepo.softDelete).toHaveBeenCalledWith(categoryId, actorId)
			expect(result).toEqual({ id: categoryId })
		})
	})

	describe('handleHardRemove', () => {
		it('should hard delete category', async () => {
			const categoryId = 1

			spyOn(fakeRepo, 'hardDelete').mockResolvedValue(categoryId)

			const result = await service.handleHardRemove(categoryId)

			expect(fakeRepo.hardDelete).toHaveBeenCalledWith(categoryId)
			expect(result).toEqual({ id: categoryId })
		})
	})
})
