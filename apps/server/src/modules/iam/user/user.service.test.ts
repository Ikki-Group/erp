import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { UserService } from './user.service'
import { UserRepo } from './user.repo'
import { UserErrors } from '../errors'
import * as dto from './user.dto'
import type { RoleDto } from '../role/role.dto'
import type { LocationDto } from '@/modules/location'

describe('UserService', () => {
	let service: UserService
	let fakeRepo: UserRepo
	let fakeServices: {
		role: any
		assignment: any
		location: any
	}

	beforeEach(() => {
		fakeRepo = {
			getById: spyOn(),
			getList: spyOn(),
			getListPaginated: spyOn(),
			create: spyOn(),
			update: spyOn(),
			remove: spyOn(),
		} as any

		fakeServices = {
			role: {
				getRelationMap: spyOn(),
			},
			assignment: {
				findByUserId: spyOn(),
			},
			location: {
				location: {
					getRelationMap: spyOn(),
				},
			},
		}

		service = new UserService(fakeServices, fakeRepo)
	})

	describe('getById', () => {
		it('should return user with enriched data', async () => {
			const mockUser: dto.UserDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				fullname: 'Test User',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const mockRoleMap = new Map([[1, { id: 1, name: 'Admin' } as RoleDto]])
			const mockLocationMap = new Map([[1, { id: 1, name: 'HQ' } as LocationDto]])
			const mockAssignments = [
				{
					id: 1,
					userId: 1,
					roleId: 1,
					locationId: 1,
					addedAt: new Date(),
					addedBy: 1,
				},
			]

			spyOn(fakeRepo, 'getById').mockResolvedValue(mockUser)
			spyOn(fakeServices.role, 'getRelationMap').mockResolvedValue(mockRoleMap)
			spyOn(fakeServices.location.location, 'getRelationMap').mockResolvedValue(mockLocationMap)
			spyOn(fakeServices.assignment, 'findByUserId').mockResolvedValue(mockAssignments)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toHaveProperty('id', 1)
			expect(result).toHaveProperty('email', 'test@example.com')
		})

		it('should return undefined for non-existent user', async () => {
			spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

			const result = await service.getById(999)

			expect(result).toBeUndefined()
		})
	})

	describe('handleDetail', () => {
		it('should return user details', async () => {
			const mockUser: dto.UserDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				fullname: 'Test User',
				pinCode: null,
				isRoot: false,
				isSystem: false,
				isActive: true,
				defaultLocationId: null,
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(service, 'getById').mockResolvedValue(mockUser)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toHaveProperty('id', 1)
			expect(result).toHaveProperty('email', 'test@example.com')
		})

		it('should throw error for non-existent user', async () => {
			spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleDetail(999)).rejects.toThrow(UserErrors.notFound(999))
		})
	})

	describe('handleCreate', () => {
		it('should create user successfully', async () => {
			const createData: dto.UserCreateDto = {
				email: 'new@example.com',
				username: 'newuser',
				fullname: 'New User',
				password: 'password123',
				pinCode: null,
				isActive: true,
				isRoot: false,
				defaultLocationId: null,
				assignments: [],
			}

			const actorId = 1
			const newUserId = 123

			spyOn(fakeRepo, 'create').mockResolvedValue(newUserId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual({ id: newUserId })
		})

		it('should throw error if create fails', async () => {
			const createData: dto.UserCreateDto = {
				email: 'new@example.com',
				username: 'newuser',
				fullname: 'New User',
				password: 'password123',
				pinCode: null,
				isActive: true,
				isRoot: false,
				defaultLocationId: null,
				assignments: [],
			}

			const actorId = 1

			spyOn(fakeRepo, 'create').mockResolvedValue(undefined)

			await expect(service.handleCreate(createData, actorId)).rejects.toThrow(
				UserErrors.createFailed()
			)
		})
	})

	describe('handleUpdate', () => {
		it('should update user successfully', async () => {
			const updateData: dto.UserUpdateDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				fullname: 'Updated Name',
				pinCode: null,
				isActive: true,
				isRoot: false,
				defaultLocationId: null,
				assignments: [],
			}

			const actorId = 1
			const existingUser: dto.UserDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				fullname: 'Test User',
				pinCode: null,
				isRoot: false,
				isSystem: false,
				isActive: true,
				defaultLocationId: null,
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			spyOn(service, 'getById').mockResolvedValue(existingUser)
			spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const result = await service.handleUpdate(updateData.id, updateData, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.update).toHaveBeenCalledWith({ ...updateData, id: 1 }, actorId)
			expect(result).toEqual({ id: 1 })
		})

		it('should throw error for non-existent user', async () => {
			const updateData: dto.UserUpdateDto = {
				id: 999,
				email: 'test@example.com',
				username: 'testuser',
				fullname: 'Updated Name',
				pinCode: null,
				isActive: true,
				isRoot: false,
				defaultLocationId: null,
				assignments: [],
			}

			const actorId = 1

			spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleUpdate(updateData.id, updateData, actorId)).rejects.toThrow(
				UserErrors.notFound(999)
			)
		})
	})

	describe('handleRemove', () => {
		it('should remove user successfully', async () => {
			const userId = 1

			spyOn(fakeRepo, 'remove').mockResolvedValue(1)

			const result = await service.handleRemove(userId)

			expect(fakeRepo.remove).toHaveBeenCalledWith(userId)
			expect(result).toEqual({ id: userId })
		})

		it('should throw error if remove fails', async () => {
			const userId = 999

			spyOn(fakeRepo, 'remove').mockResolvedValue(undefined)

			await expect(service.handleRemove(userId)).rejects.toThrow(
				UserErrors.notFound(userId)
			)
		})
	})
})
