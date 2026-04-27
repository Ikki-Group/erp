import { beforeEach, describe, expect, it, vi } from 'vitest'

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
			getById: vi.fn(),
			getList: vi.fn(),
			getListPaginated: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			remove: vi.fn(),
		} as any

		fakeServices = {
			role: {
				getRelationMap: vi.fn(),
			},
			assignment: {
				findByUserId: vi.fn(),
			},
			location: {
				location: {
					getRelationMap: vi.fn(),
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
				fullName: 'Test User',
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

			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(mockUser)
			vi.spyOn(fakeServices.role, 'getRelationMap').mockResolvedValue(mockRoleMap)
			vi.spyOn(fakeServices.location.location, 'getRelationMap').mockResolvedValue(mockLocationMap)
			vi.spyOn(fakeServices.assignment, 'findByUserId').mockResolvedValue(mockAssignments)

			const result = await service.getById(1)

			expect(fakeRepo.getById).toHaveBeenCalledWith(1)
			expect(result).toHaveProperty('id', 1)
			expect(result).toHaveProperty('email', 'test@example.com')
		})

		it('should return undefined for non-existent user', async () => {
			vi.spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

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
				fullName: 'Test User',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(mockUser)

			const result = await service.handleDetail(1)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(result).toEqual(mockUser)
		})

		it('should throw error for non-existent user', async () => {
			vi.spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleDetail(999)).rejects.toThrow(UserErrors.notFound(999))
		})
	})

	describe('handleCreate', () => {
		it('should create user successfully', async () => {
			const createData: dto.UserCreateDto = {
				email: 'new@example.com',
				username: 'newuser',
				fullName: 'New User',
			}

			const actorId = 1
			const newUserId = 123

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(newUserId)

			const result = await service.handleCreate(createData, actorId)

			expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
			expect(result).toEqual({ id: newUserId })
		})

		it('should throw error if create fails', async () => {
			const createData: dto.UserCreateDto = {
				email: 'new@example.com',
				username: 'newuser',
				fullName: 'New User',
			}

			const actorId = 1

			vi.spyOn(fakeRepo, 'create').mockResolvedValue(undefined)

			await expect(service.handleCreate(createData, actorId)).rejects.toThrow(
				UserErrors.createFailed()
			)
		})
	})

	describe('handleUpdate', () => {
		it('should update user successfully', async () => {
			const updateData: dto.UserUpdateDto = {
				id: 1,
				fullName: 'Updated Name',
			}

			const actorId = 1
			const existingUser: dto.UserDto = {
				id: 1,
				email: 'test@example.com',
				username: 'testuser',
				fullName: 'Test User',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.spyOn(service, 'getById').mockResolvedValue(existingUser)
			vi.spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const result = await service.handleUpdate(updateData, actorId)

			expect(service.getById).toHaveBeenCalledWith(1)
			expect(fakeRepo.update).toHaveBeenCalledWith(updateData, actorId)
			expect(result).toEqual({ id: 1 })
		})

		it('should throw error for non-existent user', async () => {
			const updateData: dto.UserUpdateDto = {
				id: 999,
				fullName: 'Updated Name',
			}

			const actorId = 1

			vi.spyOn(service, 'getById').mockResolvedValue(undefined)

			await expect(service.handleUpdate(updateData, actorId)).rejects.toThrow(
				UserErrors.notFound(999)
			)
		})
	})

	describe('handleRemove', () => {
		it('should remove user successfully', async () => {
			const userId = 1
			const actorId = 1

			vi.spyOn(fakeRepo, 'remove').mockResolvedValue(1)

			const result = await service.handleRemove(userId, actorId)

			expect(fakeRepo.remove).toHaveBeenCalledWith(userId, actorId)
			expect(result).toEqual({ id: userId })
		})

		it('should throw error if remove fails', async () => {
			const userId = 999
			const actorId = 1

			vi.spyOn(fakeRepo, 'remove').mockResolvedValue(undefined)

			await expect(service.handleRemove(userId, actorId)).rejects.toThrow(
				UserErrors.notFound(userId)
			)
		})
	})
})
