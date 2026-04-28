import { beforeEach, describe, expect, it, mock, spyOn, vi } from 'bun:test'

import { EmployeeService } from './employee/employee.service'
import { EmployeeRepo } from './employee/employee.repo'
import { NotFoundError, InternalServerError } from '@/core/http/errors'
import * as dto from './employee/employee.dto'

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

describe('Employee Domain Tests', () => {
	let service: EmployeeService
	let fakeRepo: EmployeeRepo
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

		service = new EmployeeService(fakeRepo)
	})

	/* ==================== SERVICE LAYER TESTS ==================== */
	describe('EmployeeService', () => {
		describe('getById', () => {
			it('should return employee when found', async () => {
				const mockEmployee: dto.EmployeeDto = {
					id: 1,
					code: 'EMP001',
					name: 'John Doe',
					email: 'john.doe@example.com',
					phone: '+1234567890',
					jobTitle: 'Developer',
					department: 'IT',
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(fakeRepo, 'getById').mockResolvedValue(mockEmployee)

				const result = await service.getById(1)

				expect(fakeRepo.getById).toHaveBeenCalledWith(1)
				expect(result).toEqual(mockEmployee)
			})

			it('should return undefined when employee not found', async () => {
				spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

				const result = await service.getById(999)

				expect(result).toBeUndefined()
			})
		})

		describe('handleList', () => {
			it('should return paginated list', async () => {
				const filter: dto.EmployeeFilterDto = { page: 1, limit: 10, q: undefined }
				const mockPaginatedResult = {
					data: [
						{
							id: 1,
							code: 'EMP001',
							name: 'John Doe',
							email: 'john.doe@example.com',
							phone: '+1234567890',
							jobTitle: 'Developer',
							department: 'IT',
							userId: null,
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
			it('should return employee detail when found', async () => {
				const mockEmployee: dto.EmployeeDto = {
					id: 1,
					code: 'EMP001',
					name: 'John Doe',
					email: 'john.doe@example.com',
					phone: '+1234567890',
					jobTitle: 'Developer',
					department: 'IT',
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(service, 'getById').mockResolvedValue(mockEmployee)

				const result = await service.handleDetail(1)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(result).toEqual(mockEmployee)
			})

			it('should throw NotFoundError when employee not found', async () => {
				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleDetail(999)).rejects.toThrow(
					new NotFoundError('Employee with ID 999 not found', 'EMPLOYEE_NOT_FOUND')
				)
			})
		})

		describe('handleCreate', () => {
			it('should create employee successfully', async () => {
				const createData: dto.EmployeeCreateDto = {
					code: 'EMP002',
					name: 'Jane Smith',
					email: 'jane.smith@example.com',
					phone: '+1234567891',
					jobTitle: 'Manager',
					department: 'HR',
					userId: null,
				}

				const actorId = 1
				const newEmployeeId = 123

				spyOn(fakeRepo, 'create').mockResolvedValue(newEmployeeId)

				const result = await service.handleCreate(createData, actorId)

				expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
				expect(result).toEqual({ id: newEmployeeId })
			})

			it('should throw InternalServerError when create fails', async () => {
				const createData: dto.EmployeeCreateDto = {
					code: 'FAIL001',
					name: 'Fail Employee',
					email: null as string | null,
					phone: null as string | null,
					jobTitle: null as string | null,
					department: null as string | null,
					userId: null as number | null,
				}

				const actorId = 1

				spyOn(fakeRepo, 'create').mockResolvedValue(undefined)

				await expect(service.handleCreate(createData, actorId)).rejects.toThrow(
					new InternalServerError('Employee creation failed', 'EMPLOYEE_CREATE_FAILED')
				)
			})
		})

		describe('handleUpdate', () => {
			it('should update employee successfully', async () => {
				const existingEmployee: dto.EmployeeDto = {
					id: 1,
					code: 'EMP001',
					name: 'John Doe',
					email: 'john.doe@example.com',
					phone: '+1234567890',
					jobTitle: 'Developer',
					department: 'IT',
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const updateData: dto.EmployeeUpdateDto = {
					id: 1,
					code: 'EMP001',
					name: 'John Updated',
					jobTitle: 'Senior Developer',
					department: 'IT',
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(existingEmployee)
				spyOn(fakeRepo, 'update').mockResolvedValue(1)

				const result = await service.handleUpdate(updateData, actorId)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(fakeRepo.update).toHaveBeenCalledWith(updateData, actorId)
				expect(result).toEqual({ id: 1 })
			})

			it('should throw NotFoundError when updating non-existent employee', async () => {
				const updateData: dto.EmployeeUpdateDto = {
					id: 999,
					code: 'EMP999',
					name: 'Non-existent',
					jobTitle: 'Unknown',
					department: 'UNKNOWN',
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleUpdate(updateData, actorId)).rejects.toThrow(
					new NotFoundError('Employee with ID 999 not found', 'EMPLOYEE_NOT_FOUND')
				)
			})
		})

		describe('handleRemove', () => {
			it('should remove employee successfully', async () => {
				const existingEmployee: dto.EmployeeDto = {
					id: 1,
					code: 'EMP001',
					name: 'John Doe',
					email: 'john.doe@example.com',
					phone: '+1234567890',
					jobTitle: 'Developer',
					department: 'IT',
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(existingEmployee)
				spyOn(fakeRepo, 'remove').mockResolvedValue(1)

				const result = await service.handleRemove(1, actorId)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(fakeRepo.remove).toHaveBeenCalledWith(1, actorId)
				expect(result).toEqual({ id: 1 })
			})

			it('should throw NotFoundError when removing non-existent employee', async () => {
				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleRemove(999, actorId)).rejects.toThrow(
					new NotFoundError('Employee with ID 999 not found', 'EMPLOYEE_NOT_FOUND')
				)
			})
		})
	})

	/* ==================== DTO VALIDATION TESTS ==================== */
	describe('Employee DTO Validation', () => {
		describe('EmployeeDto', () => {
			it('should validate correct employee data', () => {
				const validData = {
					id: 1,
					code: 'EMP001',
					name: 'John Doe',
					email: 'john.doe@example.com',
					phone: '+1234567890',
					jobTitle: 'Developer',
					department: 'IT',
					userId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const result = dto.EmployeeDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid employee data', () => {
				const invalidData = {
					id: 'invalid',
					code: '',
					name: '',
					// missing required fields
				}

				const result = dto.EmployeeDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('EmployeeCreateDto', () => {
			it('should validate correct create data', () => {
				const validData = {
					code: 'EMP002',
					name: 'Jane Smith',
					email: 'jane.smith@example.com',
					phone: '+1234567891',
					jobTitle: 'Manager',
					department: 'HR',
					userId: null,
				}

				const result = dto.EmployeeCreateDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid create data', () => {
				const invalidData = {
					code: '', // empty code
					name: '', // empty name
					email: 'invalid-email', // invalid email format
				}

				const result = dto.EmployeeCreateDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('EmployeeFilterDto', () => {
			it('should validate correct filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					q: 'john',
				}

				const result = dto.EmployeeFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should accept minimal filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					q: undefined,
				}

				const result = dto.EmployeeFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})
		})
	})

	/* ==================== INTEGRATION TESTS ==================== */
	describe('Employee Integration Tests', () => {
		it('should handle complete employee lifecycle', async () => {
			// Create
			const createData: dto.EmployeeCreateDto = {
				code: 'EMP003',
				name: 'Integration Test',
				email: 'integration@test.com',
				phone: '+1234567899',
				jobTitle: 'Test Engineer',
				department: 'QA',
				userId: null,
			}

			const actorId = 1
			const newEmployeeId = 456

			spyOn(fakeRepo, 'create').mockResolvedValue(newEmployeeId)

			const createResult = await service.handleCreate(createData, actorId)
			expect(createResult).toEqual({ id: newEmployeeId })

			// Read
			const mockEmployee: dto.EmployeeDto = {
				id: newEmployeeId,
				code: createData.code,
				name: createData.name,
				email: createData.email as string | null,
				phone: createData.phone as string | null,
				jobTitle: createData.jobTitle as string | null,
				department: createData.department as string | null,
				userId: createData.userId as number | null,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: actorId,
				updatedBy: actorId,
			}

			spyOn(service, 'getById').mockResolvedValue(mockEmployee)

			const readResult = await service.handleDetail(newEmployeeId)
			expect(readResult).toEqual(mockEmployee)

			// Update
			const updateData: dto.EmployeeUpdateDto = {
				id: newEmployeeId,
				code: 'EMP456',
				name: 'Integration Test Updated',
				jobTitle: 'Senior Test Engineer',
				department: 'QA',
			}

			spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const updateResult = await service.handleUpdate(updateData, actorId)
			expect(updateResult).toEqual({ id: newEmployeeId })

			// Delete
			spyOn(fakeRepo, 'remove').mockResolvedValue(1)

			const deleteResult = await service.handleRemove(newEmployeeId, actorId)
			expect(deleteResult).toEqual({ id: newEmployeeId })
		})

		it('should handle cache integration correctly', async () => {
			const mockEmployee: dto.EmployeeDto = {
				id: 1,
				code: 'EMP001',
				name: 'John Doe',
				email: 'john.doe@example.com',
				phone: '+1234567890',
				jobTitle: 'Developer',
				department: 'IT',
				userId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1,
				updatedBy: 1,
			}

			spyOn(mockCache, 'getOrSet').mockImplementation(async ({ factory }: { factory: () => Promise<any> }) => {
				return await factory()
			})
			spyOn(fakeRepo, 'getById').mockResolvedValue(mockEmployee)

			const result = await service.getById(1)

			expect(mockCache.getOrSet).toHaveBeenCalledWith({
				key: CACHE_KEY_DEFAULT.byId(1),
				factory: expect.any(Function),
			})
			expect(result).toEqual(mockEmployee)
		})
	})
})
