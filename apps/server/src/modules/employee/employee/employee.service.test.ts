import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { EmployeeService } from './employee.service'
import { EmployeeRepo } from './employee.repo'
import { NotFoundError, InternalServerError } from '@/core/http/errors'
import * as dto from './employee.dto'

describe('EmployeeService', () => {
	let service: EmployeeService
	let fakeRepo: EmployeeRepo

	beforeEach(() => {
		fakeRepo = {
			getById: spyOn(),
			getListPaginated: spyOn(),
			create: spyOn(),
			update: spyOn(),
			remove: spyOn(),
		} as any

		service = new EmployeeService(fakeRepo)
	})

	describe('getById', () => {
		it('should return employee when found', async () => {
			const mockEmployee: dto.EmployeeDto = {
				id: 1,
				code: 'EMP001',
				firstName: 'John',
				lastName: 'Doe',
				email: 'john.doe@example.com',
				phone: '+1234567890',
				department: 'IT',
				position: 'Developer',
				salary: 50000,
				startDate: new Date(),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
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
			const filter: dto.EmployeeFilterDto = { page: 1, limit: 10 }
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						code: 'EMP001',
						firstName: 'John',
						lastName: 'Doe',
						email: 'john.doe@example.com',
						department: 'IT',
						position: 'Developer',
						isActive: true,
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
		it('should return employee detail when found', async () => {
			const mockEmployee: dto.EmployeeDto = {
				id: 1,
				code: 'EMP001',
				firstName: 'John',
				lastName: 'Doe',
				email: 'john.doe@example.com',
				phone: '+1234567890',
				department: 'IT',
				position: 'Developer',
				salary: 50000,
				startDate: new Date(),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
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
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane.smith@example.com',
				phone: '+1234567891',
				department: 'HR',
				position: 'Manager',
				salary: 60000,
				startDate: new Date(),
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
				firstName: 'Fail',
				lastName: 'Employee',
				email: 'fail@example.com',
				phone: '+1234567899',
				department: 'TEST',
				position: 'Tester',
				salary: 1000,
				startDate: new Date(),
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
				firstName: 'John',
				lastName: 'Doe',
				email: 'john.doe@example.com',
				phone: '+1234567890',
				department: 'IT',
				position: 'Developer',
				salary: 50000,
				startDate: new Date(),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: dto.EmployeeUpdateDto = {
				id: 1,
				firstName: 'John Updated',
				lastName: 'Doe Updated',
				salary: 55000,
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
				firstName: 'Non-existent',
			}

			const actorId = 1

			spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleUpdate(updateData, actorId)).rejects.toThrow(
				new NotFoundError('Employee with ID 999 not found', 'EMPLOYEE_NOT_FOUND')
			)
		})

		it('should throw NotFoundError when update returns falsy', async () => {
			const existingEmployee: dto.EmployeeDto = {
				id: 1,
				code: 'EMP001',
				firstName: 'John',
				lastName: 'Doe',
				email: 'john.doe@example.com',
				phone: '+1234567890',
				department: 'IT',
				position: 'Developer',
				salary: 50000,
				startDate: new Date(),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const updateData: dto.EmployeeUpdateDto = {
				id: 1,
				firstName: 'Failed Update',
			}

			const actorId = 1

			spyOn(service, 'getById').mockResolvedValue(existingEmployee)
			spyOn(fakeRepo, 'update').mockResolvedValue(undefined)

			await expect(service.handleUpdate(updateData, actorId)).rejects.toThrow(
				new NotFoundError('Employee with ID 1 not found', 'EMPLOYEE_NOT_FOUND')
			)
		})
	})

	describe('handleRemove', () => {
		it('should remove employee successfully', async () => {
			const existingEmployee: dto.EmployeeDto = {
				id: 1,
				code: 'EMP001',
				firstName: 'John',
				lastName: 'Doe',
				email: 'john.doe@example.com',
				phone: '+1234567890',
				department: 'IT',
				position: 'Developer',
				salary: 50000,
				startDate: new Date(),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
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

		it('should throw NotFoundError when remove returns falsy', async () => {
			const existingEmployee: dto.EmployeeDto = {
				id: 1,
				code: 'EMP001',
				firstName: 'John',
				lastName: 'Doe',
				email: 'john.doe@example.com',
				phone: '+1234567890',
				department: 'IT',
				position: 'Developer',
				salary: 50000,
				startDate: new Date(),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const actorId = 1

			spyOn(service, 'getById').mockResolvedValue(existingEmployee)
			spyOn(fakeRepo, 'remove').mockResolvedValue(undefined)

			await expect(service.handleRemove(1, actorId)).rejects.toThrow(
				new NotFoundError('Employee with ID 1 not found', 'EMPLOYEE_NOT_FOUND')
			)
		})
	})
})
