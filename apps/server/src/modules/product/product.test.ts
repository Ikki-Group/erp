import { beforeEach, describe, expect, it, mock, spyOn, vi } from 'bun:test'

import { ProductService } from './product/product.service'
import { ProductRepo } from './product/product.repo'
import { NotFoundError, InternalServerError } from '@/core/http/errors'
import * as dto from './product/product.dto'

// Mock cache module
vi.mock('@/core/cache', () => ({
	bento: {
		namespace: mock(() => ({
			getOrSet: mock(),
			deleteMany: mock(),
		})),
	},
	CACHE_KEY_DEFAULT: {
		byId: (id: number) => `${id}`,
	},
}))

// Mock logger
vi.mock('@/core/logger', () => ({
	logger: {
		error: mock(),
	},
}))

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'
import { logger } from '@/core/logger'

describe('Product Domain Tests', () => {
	let service: ProductService
	let fakeRepo: ProductRepo
	let mockCache: any

	beforeEach(() => {
		fakeRepo = {
			getById: mock(),
			getListPaginated: mock(),
			create: mock(),
			update: mock(),
			remove: mock(),
		} as any

		mockCache = {
			getOrSet: mock(),
			deleteMany: mock(),
		}

		// Setup mock for bento.namespace
		const mockNamespace = mock(() => mockCache)
		;(bento as any).namespace = mockNamespace

		service = new ProductService(fakeRepo)
	})

	/* ==================== SERVICE LAYER TESTS ==================== */
	describe('ProductService', () => {
		describe('getById', () => {
			it('should return product when found', async () => {
				const mockProduct: dto.ProductDto = {
					id: 1,
					name: 'Test Product',
					description: 'Test Description',
					sku: 'TEST-001',
					basePrice: '100.00',
					locationId: 1,
					categoryId: null,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(fakeRepo, 'getById').mockResolvedValue(mockProduct)

				const result = await service.getById(1)

				expect(fakeRepo.getById).toHaveBeenCalledWith(1)
				expect(result).toEqual(mockProduct)
			})

			it('should return undefined when product not found', async () => {
				spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

				const result = await service.getById(999)

				expect(result).toBeUndefined()
			})
		})

		describe('handleList', () => {
			it('should return paginated list', async () => {
				const filter: dto.ProductFilterDto = { page: 1, limit: 10, q: undefined }
				const mockPaginatedResult = {
					data: [
						{
							id: 1,
							name: 'Test Product',
							description: 'Test Description',
							sku: 'TEST-001',
							basePrice: '100.00',
							locationId: 1,
							categoryId: null,
							isActive: true,
							createdAt: new Date(),
							updatedAt: new Date(),
							createdBy: 1,
							updatedBy: 1,
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
			it('should return product detail when found', async () => {
				const mockProduct: dto.ProductDto = {
					id: 1,
					name: 'Test Product',
					description: 'Test Description',
					sku: 'TEST-001',
					basePrice: '100.00',
					locationId: 1,
					categoryId: null,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(service, 'getById').mockResolvedValue(mockProduct)

				const result = await service.handleDetail(1)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(result).toEqual(mockProduct)
			})

			it('should throw NotFoundError when product not found', async () => {
				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleDetail(999)).rejects.toThrow(
					new NotFoundError('Product with ID 999 not found', 'PRODUCT_NOT_FOUND')
				)
			})
		})

		describe('handleCreate', () => {
			it('should create product successfully', async () => {
				const createData: dto.ProductCreateDto = {
					name: 'New Product',
					description: 'New Description',
					sku: 'NEW-001',
					basePrice: '150.00',
					locationId: 1,
					categoryId: null,
				}

				const actorId = 1
				const newProductId = 123

				spyOn(fakeRepo, 'create').mockResolvedValue(newProductId)

				const result = await service.handleCreate(createData, actorId)

				expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
				expect(result).toEqual({ id: newProductId })
			})

			it('should throw InternalServerError when create fails', async () => {
				const createData: dto.ProductCreateDto = {
					name: 'Fail Product',
					description: 'Fail Description',
					sku: 'FAIL-001',
					basePrice: '100.00',
					locationId: 1,
					categoryId: null,
				}

				const actorId = 1

				spyOn(fakeRepo, 'create').mockResolvedValue(undefined)

				await expect(service.handleCreate(createData, actorId)).rejects.toThrow(
					new InternalServerError('Product creation failed', 'PRODUCT_CREATE_FAILED')
				)
			})
		})

		describe('handleUpdate', () => {
			it('should update product successfully', async () => {
				const existingProduct: dto.ProductDto = {
					id: 1,
					name: 'Test Product',
					description: 'Test Description',
					sku: 'TEST-001',
					basePrice: '100.00',
					locationId: 1,
					categoryId: null,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const updateData: dto.ProductUpdateDto = {
					id: 1,
					name: 'Updated Product',
					basePrice: '120.00',
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(existingProduct)
				spyOn(fakeRepo, 'update').mockResolvedValue(1)

				const result = await service.handleUpdate(updateData, actorId)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(fakeRepo.update).toHaveBeenCalledWith(updateData, actorId)
				expect(result).toEqual({ id: 1 })
			})

			it('should throw NotFoundError when updating non-existent product', async () => {
				const updateData: dto.ProductUpdateDto = {
					id: 999,
					name: 'Non-existent Product',
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleUpdate(updateData, actorId)).rejects.toThrow(
					new NotFoundError('Product with ID 999 not found', 'PRODUCT_NOT_FOUND')
				)
			})
		})

		describe('handleRemove', () => {
			it('should remove product successfully', async () => {
				const existingProduct: dto.ProductDto = {
					id: 1,
					name: 'Test Product',
					description: 'Test Description',
					sku: 'TEST-001',
					basePrice: '100.00',
					locationId: 1,
					categoryId: null,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(existingProduct)
				spyOn(fakeRepo, 'remove').mockResolvedValue(1)

				const result = await service.handleRemove(1, actorId)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(fakeRepo.remove).toHaveBeenCalledWith(1, actorId)
				expect(result).toEqual({ id: 1 })
			})

			it('should throw NotFoundError when removing non-existent product', async () => {
				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleRemove(999, actorId)).rejects.toThrow(
					new NotFoundError('Product with ID 999 not found', 'PRODUCT_NOT_FOUND')
				)
			})
		})
	})

	/* ==================== DTO VALIDATION TESTS ==================== */
	describe('Product DTO Validation', () => {
		describe('ProductDto', () => {
			it('should validate correct product data', () => {
				const validData = {
					id: 1,
					name: 'Test Product',
					description: 'Test Description',
					sku: 'TEST-001',
					basePrice: '100.00',
					locationId: 1,
					categoryId: null,
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const result = dto.ProductDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid product data', () => {
				const invalidData = {
					id: 'invalid',
					name: '',
					// missing required fields
				}

				const result = dto.ProductDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('ProductCreateDto', () => {
			it('should validate correct create data', () => {
				const validData = {
					name: 'New Product',
					description: 'New Description',
					sku: 'NEW-001',
					basePrice: '150.00',
					locationId: 1,
					categoryId: null,
				}

				const result = dto.ProductCreateDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid create data', () => {
				const invalidData = {
					name: '', // empty name
					sku: '', // empty sku
					basePrice: 'invalid', // invalid price format
				}

				const result = dto.ProductCreateDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('ProductFilterDto', () => {
			it('should validate correct filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					q: 'product',
				}

				const result = dto.ProductFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should accept minimal filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					q: undefined,
				}

				const result = dto.ProductFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})
		})
	})

	/* ==================== INTEGRATION TESTS ==================== */
	describe('Product Integration Tests', () => {
		it('should handle complete product lifecycle', async () => {
			// Create
			const createData: dto.ProductCreateDto = {
				name: 'Integration Product',
				description: 'Integration Description',
				sku: 'INT-001',
				basePrice: '200.00',
				locationId: 1,
				categoryId: null,
			}

			const actorId = 1
			const newProductId = 456

			spyOn(fakeRepo, 'create').mockResolvedValue(newProductId)

			const createResult = await service.handleCreate(createData, actorId)
			expect(createResult).toEqual({ id: newProductId })

			// Read
			const mockProduct: dto.ProductDto = {
				id: newProductId,
				name: createData.name,
				description: createData.description,
				sku: createData.sku,
				basePrice: createData.basePrice,
				locationId: createData.locationId,
				categoryId: createData.categoryId,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: actorId,
				updatedBy: actorId,
			}

			spyOn(service, 'getById').mockResolvedValue(mockProduct)

			const readResult = await service.handleDetail(newProductId)
			expect(readResult).toEqual(mockProduct)

			// Update
			const updateData: dto.ProductUpdateDto = {
				id: newProductId,
				name: 'Integration Product Updated',
				basePrice: '250.00',
			}

			spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const updateResult = await service.handleUpdate(updateData, actorId)
			expect(updateResult).toEqual({ id: newProductId })

			// Delete
			spyOn(fakeRepo, 'remove').mockResolvedValue(1)

			const deleteResult = await service.handleRemove(newProductId, actorId)
			expect(deleteResult).toEqual({ id: newProductId })
		})

		it('should handle cache integration correctly', async () => {
			const mockProduct: dto.ProductDto = {
				id: 1,
				name: 'Test Product',
				description: 'Test Description',
				sku: 'TEST-001',
				basePrice: '100.00',
				locationId: 1,
				categoryId: null,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1,
				updatedBy: 1,
			}

			spyOn(mockCache, 'getOrSet').mockImplementation(async ({ factory }: { factory: () => Promise<any> }) => {
				return await factory()
			})
			spyOn(fakeRepo, 'getById').mockResolvedValue(mockProduct)

			const result = await service.getById(1)

			expect(mockCache.getOrSet).toHaveBeenCalledWith({
				key: CACHE_KEY_DEFAULT.byId(1),
				factory: expect.any(Function),
			})
			expect(result).toEqual(mockProduct)
		})
	})
})
