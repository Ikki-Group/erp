import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductService } from './product.service'
import { ProductRepo } from './product.repo'
import { ConflictError, NotFoundError } from '@/core/http/errors'
import * as dto from './product.dto'
import type { ProductCategoryDto } from '../product-category/product-category.dto'

describe('ProductService', () => {
	let service: ProductService
	let fakeRepo: ProductRepo
	let fakeCategoryService: any

	beforeEach(() => {
		fakeRepo = {
			getById: vi.fn(),
			getListPaginated: vi.fn(),
			checkScopedConflict: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			softDelete: vi.fn(),
			hardDelete: vi.fn(),
		} as any

		fakeCategoryService = {
			handleList: vi.fn(),
			getById: vi.fn(),
		}

		service = new ProductService(fakeCategoryService, fakeRepo)
	})

	describe('getById', () => {
		it('should return product when found', async () => {
			const mockProduct: dto.ProductDto = {
				id: 1,
				sku: 'TEST-001',
				name: 'Test Product',
				description: 'Test Description',
				price: 100,
				categoryId: 1,
				locationId: 1,
				hasVariants: false,
				variants: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(mockProduct)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockProduct)
		})

		it('should throw NotFoundError when product not found', async () => {
			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			await expect(service.getById(999)).rejects.toThrow(
				new NotFoundError('Product with ID 999 not found', 'PRODUCT_NOT_FOUND')
			)
		})
	})

	describe('handleList', () => {
		it('should return paginated list with categories', async () => {
			const mockProducts: dto.ProductDto[] = [
				{
					id: 1,
					sku: 'TEST-001',
					name: 'Test Product',
					description: 'Test Description',
					price: 100,
					categoryId: 1,
					locationId: 1,
					hasVariants: false,
					variants: [],
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]

			const mockCategories: ProductCategoryDto[] = [
				{ id: 1, name: 'Test Category', description: null, createdAt: new Date(), updatedAt: new Date() },
			]

			const filter = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: mockProducts,
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}

			vi.spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)
			vi.spyOn(fakeCategoryService, 'handleList').mockResolvedValue({
				data: mockCategories,
				meta: { page: 1, limit: 1000, total: 1, totalPages: 1 },
			})

			const result = await service.handleList(filter)

			expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
			expect(fakeCategoryService.handleList).toHaveBeenCalledWith({
				q: undefined,
				page: 1,
				limit: 1000,
			})
			expect(result.data[0]).toHaveProperty('category')
			expect(result.data[0].category?.name).toBe('Test Category')
		})
	})

	describe('handleDetail', () => {
		it('should return product detail with category', async () => {
			const mockProduct: dto.ProductDto = {
				id: 1,
				sku: 'TEST-001',
				name: 'Test Product',
				description: 'Test Description',
				price: 100,
				categoryId: 1,
				locationId: 1,
				hasVariants: false,
				variants: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockCategory: ProductCategoryDto = {
				id: 1,
				name: 'Test Category',
				description: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(mockProduct)
			vi.spyOn(fakeCategoryService, 'getById').mockResolvedValue(mockCategory)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeCategoryService.getById).toHaveBeenCalledWith(1)
			expect(result).toHaveProperty('category')
			expect(result.category?.name).toBe('Test Category')
		})

		it('should return product detail without category when categoryId is null', async () => {
			const mockProduct: dto.ProductDto = {
				id: 1,
				sku: 'TEST-001',
				name: 'Test Product',
				description: 'Test Description',
				price: 100,
				categoryId: null,
				locationId: 1,
				hasVariants: false,
				variants: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(mockProduct)
			vi.spyOn(fakeCategoryService, 'getById').mockResolvedValue(undefined)

			const result = await service.handleDetail(1)

			expect(fakeCategoryService.getById).not.toHaveBeenCalled()
			expect(result.category).toBeNull()
		})
	})

	describe('handleCreate', () => {
		it('should create product successfully', async () => {
			const createData: dto.ProductMutationDto = {
				sku: 'NEW-001',
				name: 'New Product',
				description: 'New Description',
				price: 200,
				categoryId: 1,
				locationId: 1,
				hasVariants: false,
				variants: [],
			}

			const actorId = 1
			const newProductId = 123

			vi.spyOn(fakeRepo, 'checkScopedConflict').mockResolvedValue(undefined)
			vi.spyOn(fakeRepo, 'create').mockResolvedValue(newProductId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.checkScopedConflict).toHaveBeenCalledWith(1, {
				sku: 'NEW-001',
				name: 'New Product',
			})
			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual({ id: newProductId })
		})

		it('should validate variants when creating product with variants', async () => {
			const createData: dto.ProductMutationDto = {
				sku: 'VAR-001',
				name: 'Variant Product',
				description: 'Product with variants',
				price: 0,
				categoryId: 1,
				locationId: 1,
				hasVariants: true,
				variants: [
					{ name: 'Variant 1', price: 100, isDefault: true },
					{ name: 'Variant 2', price: 120, isDefault: false },
				],
			}

			const actorId = 1
			const newProductId = 124

			vi.spyOn(fakeRepo, 'checkScopedConflict').mockResolvedValue(undefined)
			vi.spyOn(fakeRepo, 'create').mockResolvedValue(newProductId)

			const result = await service.handleCreate(createData, actorId)

			expect(result).toEqual({ id: newProductId })
		})

		it('should throw error when multiple variants are set as default', async () => {
			const createData: dto.ProductMutationDto = {
				sku: 'VAR-002',
				name: 'Invalid Variant Product',
				description: 'Product with multiple default variants',
				price: 0,
				categoryId: 1,
				locationId: 1,
				hasVariants: true,
				variants: [
					{ name: 'Variant 1', price: 100, isDefault: true },
					{ name: 'Variant 2', price: 120, isDefault: true },
				],
			}

			const actorId = 1

			vi.spyOn(fakeRepo, 'checkScopedConflict').mockResolvedValue(undefined)

			await expect(service.handleCreate(createData, actorId)).rejects.toThrow(
				new ConflictError('Only one variant can be set as default', 'MULTIPLE_DEFAULT_VARIANTS')
			)
		})
	})

	describe('handleUpdate', () => {
		it('should update product successfully', async () => {
			const existingProduct: dto.ProductDto = {
				id: 1,
				sku: 'OLD-001',
				name: 'Old Product',
				description: 'Old Description',
				price: 100,
				categoryId: 1,
				locationId: 1,
				hasVariants: false,
				variants: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: dto.ProductMutationDto = {
				sku: 'UPDATED-001',
				name: 'Updated Product',
				description: 'Updated Description',
				price: 150,
				categoryId: 2,
				locationId: 1,
				hasVariants: false,
				variants: [],
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingProduct)
			vi.spyOn(fakeRepo, 'checkScopedConflict').mockResolvedValue(undefined)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const result = await service.handleUpdate(1, updateData, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.checkScopedConflict).toHaveBeenCalledWith(1, {
				sku: 'UPDATED-001',
				name: 'Updated Product',
			}, 1)
			expect(fakeRepo.update).toHaveBeenCalledWith(1, updateData, actorId)
			expect(result).toEqual({ id: 1 })
		})

		it('should use existing values when update data is partial', async () => {
			const existingProduct: dto.ProductDto = {
				id: 1,
				sku: 'OLD-001',
				name: 'Old Product',
				description: 'Old Description',
				price: 100,
				categoryId: 1,
				locationId: 1,
				hasVariants: false,
				variants: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: dto.ProductMutationDto = {
				name: 'Updated Name Only',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(existingProduct)
			vi.spyOn(fakeRepo, 'checkScopedConflict').mockResolvedValue(undefined)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(1)

			await service.handleUpdate(1, updateData, actorId)

			expect(fakeRepo.checkScopedConflict).toHaveBeenCalledWith(1, {
				sku: 'OLD-001',
				name: 'Updated Name Only',
			}, 1)
		})
	})

	describe('handleRemove', () => {
		it('should soft delete product', async () => {
			const productId = 1
			const actorId = 1

			vi.spyOn(fakeRepo, 'softDelete').mockResolvedValue(1)

			const result = await service.handleRemove(productId, actorId)

			expect(fakeRepo.softDelete).toHaveBeenCalledWith(productId, actorId)
			expect(result).toEqual({ id: productId })
		})
	})

	describe('handleHardRemove', () => {
		it('should hard delete product', async () => {
			const productId = 1

			vi.spyOn(fakeRepo, 'hardDelete').mockResolvedValue(1)

			const result = await service.handleHardRemove(productId)

			expect(fakeRepo.hardDelete).toHaveBeenCalledWith(productId)
			expect(result).toEqual({ id: productId })
		})
	})
})
