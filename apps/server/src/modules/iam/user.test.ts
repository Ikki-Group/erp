import { beforeEach, describe, expect, it, mock, spyOn, vi } from 'bun:test'

import { UserService } from './user/user.service'
import { UserRepo } from './user/user.repo'
import { NotFoundError, InternalServerError } from '@/core/http/errors'
import * as dto from './user/user.dto'

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

// Mock dependencies
vi.mock('@/modules/location', () => ({
	LocationServiceModule: class {
		getRelationMap = mock()
	},
}))

vi.mock('./assignment/assignment.service', () => ({
	UserAssignmentService: class {
		handleReplaceBulkByUserId = mock()
	},
}))

vi.mock('./role/role.service', () => ({
	RoleService: class {
		getRelationMap = mock()
	},
}))

import { bento, CACHE_KEY_DEFAULT } from '@/core/cache'

describe('User Domain Tests', () => {
	let service: UserService
	let fakeRepo: UserRepo
	let mockCache: any
	let mockServices: any

	beforeEach(() => {
		fakeRepo = {
			getById: mock(),
			getList: mock(),
			getListPaginated: mock(),
			getByIdentifier: mock(),
			count: mock(),
			seed: mock(),
			create: mock(),
			update: mock(),
			updatePassword: mock(),
			remove: mock(),
			getPasswordHash: mock(),
		} as any

		mockCache = {
			getOrSet: mock(),
			deleteMany: mock(),
		}

		// Setup mock for bento.namespace
		const mockNamespace = mock(() => mockCache)
		;(bento as any).namespace = mockNamespace

		// Setup mock services
		mockServices = {
			role: {
				getRelationMap: mock(),
			},
			assignment: {
				handleReplaceBulkByUserId: mock(),
			},
			location: {
				master: {
					getRelationMap: mock(),
				},
			},
		}

		service = new UserService(mockServices, fakeRepo)
	})

	/* ==================== SERVICE LAYER TESTS ==================== */
	describe('UserService', () => {
		describe('getById', () => {
			it('should return user when found', async () => {
				const mockUser: dto.UserDto = {
					id: 1,
					email: 'john@example.com',
					username: 'john',
					fullname: 'John Doe',
					pinCode: null,
					isRoot: false,
					isSystem: false,
					isActive: true,
					defaultLocationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(fakeRepo, 'getById').mockResolvedValue(mockUser)

				const result = await service.getById(1)

				expect(fakeRepo.getById).toHaveBeenCalledWith(1)
				expect(result).toEqual(mockUser)
			})

			it('should return undefined when user not found', async () => {
				spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

				const result = await service.getById(999)

				expect(result).toBeUndefined()
			})
		})

		describe('getDetailById', () => {
			it('should return user detail when found', async () => {
				const mockUser: dto.UserDto = {
					id: 1,
					email: 'john@example.com',
					username: 'john',
					fullname: 'John Doe',
					pinCode: null,
					isRoot: false,
					isSystem: false,
					isActive: true,
					defaultLocationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(service, 'getById').mockResolvedValue(mockUser)
				spyOn(service as any, 'buildUserAssignments').mockResolvedValue([])

				const result = await service.getDetailById(1)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(result).toEqual({ ...mockUser, assignments: [] })
			})

			it('should throw NotFoundError when user not found', async () => {
				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.getDetailById(999)).rejects.toThrow(
					new NotFoundError('User with ID 999 not found', 'USER_NOT_FOUND')
				)
			})
		})

		describe('getByIdentifier', () => {
			it('should return user with password hash when found', async () => {
				const mockUser = {
					id: 1,
					email: 'john@example.com',
					username: 'john',
					passwordHash: 'hashed_password',
				}

				spyOn(fakeRepo, 'getByIdentifier').mockResolvedValue(mockUser)

				const result = await service.getByIdentifier('john@example.com')

				expect(fakeRepo.getByIdentifier).toHaveBeenCalledWith('john@example.com')
				expect(result).toEqual(mockUser)
			})

			it('should return null when user not found', async () => {
				spyOn(fakeRepo, 'getByIdentifier').mockResolvedValue(null)

				const result = await service.getByIdentifier('unknown@example.com')

				expect(result).toBeNull()
			})
		})

		describe('handleList', () => {
			it('should return paginated list with user details', async () => {
				const filter: dto.UserFilterDto = { page: 1, limit: 10, q: undefined, isActive: true, isRoot: false }
				const mockPaginatedResult = {
					data: [
						{
							id: 1,
							email: 'john@example.com',
							username: 'john',
							fullname: 'John Doe',
							pinCode: null,
							isRoot: false,
							isSystem: false,
							isActive: true,
							defaultLocationId: null,
							createdAt: new Date(),
							updatedAt: new Date(),
							createdBy: 1,
							updatedBy: 1,
						},
					],
					meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
				}

				spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)
				spyOn(mockServices.role, 'getRelationMap').mockResolvedValue(new Map())
				spyOn(mockServices.location.master, 'getRelationMap').mockResolvedValue(new Map())
				spyOn(service as any, 'buildUserAssignments').mockResolvedValue([])

				const result = await service.handleList(filter)

				expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
				expect(result.data[0]).toHaveProperty('assignments')
			})
		})

		describe('handleDetail', () => {
			it('should return user detail with audit resolved', async () => {
				const mockUser: dto.UserDto = {
					id: 1,
					email: 'john@example.com',
					username: 'john',
					fullname: 'John Doe',
					pinCode: null,
					isRoot: false,
					isSystem: false,
					isActive: true,
					defaultLocationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(service, 'getById').mockResolvedValue(mockUser)
				spyOn(service as any, 'buildUserAssignments').mockResolvedValue([])

				const result = await service.handleDetail(1)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(result).toHaveProperty('assignments')
				expect(result).toBeDefined()
			})

			it('should throw NotFoundError when user not found', async () => {
				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleDetail(999)).rejects.toThrow(
					new NotFoundError('User with ID 999 not found', 'USER_NOT_FOUND')
				)
			})
		})

		describe('handleCreate', () => {
			it('should create user successfully', async () => {
				const createData: dto.UserCreateDto = {
					email: 'new@example.com',
					username: 'newuser',
					fullname: 'New User',
					pinCode: null,
					isActive: true,
					isRoot: false,
					defaultLocationId: null,
					password: 'password123',
					assignments: [],
				}

				const actorId = 1
				const newUserId = 123

				spyOn(fakeRepo, 'create').mockResolvedValue(newUserId)

				const result = await service.handleCreate(createData, actorId)

				expect(fakeRepo.create).toHaveBeenCalledWith(
					expect.objectContaining({
						email: createData.email,
						username: createData.username,
						fullname: createData.fullname,
						passwordHash: expect.any(String),
					}),
					actorId
				)
				expect(result).toEqual({ id: newUserId })
			})

			it('should create user with assignments', async () => {
				const createData: dto.UserCreateDto = {
					email: 'new@example.com',
					username: 'newuser',
					fullname: 'New User',
					pinCode: null,
					isActive: true,
					isRoot: false,
					defaultLocationId: null,
					password: 'password123',
					assignments: [
						{ locationId: 1, roleId: 1 },
						{ locationId: 2, roleId: 2 },
					],
				}

				const actorId = 1
				const newUserId = 123

				spyOn(fakeRepo, 'create').mockResolvedValue(newUserId)
				spyOn(mockServices.assignment, 'handleReplaceBulkByUserId').mockResolvedValue(undefined)

				const result = await service.handleCreate(createData, actorId)

				expect(fakeRepo.create).toHaveBeenCalled()
				expect(mockServices.assignment.handleReplaceBulkByUserId).toHaveBeenCalledWith(
					newUserId,
					[
						{ userId: newUserId, locationId: 1, roleId: 1 },
						{ userId: newUserId, locationId: 2, roleId: 2 },
					],
					actorId
				)
				expect(result).toEqual({ id: newUserId })
			})
		})

		describe('handleUpdate', () => {
			it('should update user successfully', async () => {
				const existingUser: dto.UserDto = {
					id: 1,
					email: 'john@example.com',
					username: 'john',
					fullname: 'John Doe',
					pinCode: null,
					isRoot: false,
					isSystem: false,
					isActive: true,
					defaultLocationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const updateData: dto.UserUpdateDto = {
					id: 1,
					email: 'updated@example.com',
					username: 'john',
					fullname: 'John Updated',
					pinCode: null,
					isActive: true,
					isRoot: false,
					defaultLocationId: null,
					assignments: [],
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(existingUser)
				spyOn(fakeRepo, 'update').mockResolvedValue(1)

				const result = await service.handleUpdate(1, updateData, actorId)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(fakeRepo.update).toHaveBeenCalledWith(updateData, actorId)
				expect(result).toEqual({ id: 1 })
			})

			it('should update user with new password', async () => {
				const existingUser: dto.UserDto = {
					id: 1,
					email: 'john@example.com',
					username: 'john',
					fullname: 'John Doe',
					pinCode: null,
					isRoot: false,
					isSystem: false,
					isActive: true,
					defaultLocationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const updateData: dto.UserUpdateDto = {
					id: 1,
					email: 'john@example.com',
					username: 'john',
					fullname: 'John Doe',
					pinCode: null,
					isActive: true,
					isRoot: false,
					defaultLocationId: null,
					password: 'newpassword123',
					assignments: [],
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(existingUser)
				spyOn(fakeRepo, 'update').mockResolvedValue(1)

				const result = await service.handleUpdate(1, updateData, actorId)

				expect(fakeRepo.update).toHaveBeenCalledWith(
					expect.objectContaining({
						passwordHash: expect.any(String),
					}),
					actorId
				)
				expect(result).toEqual({ id: 1 })
			})

			it('should throw NotFoundError when updating non-existent user', async () => {
				const updateData: dto.UserUpdateDto = {
					id: 999,
					email: 'unknown@example.com',
					username: 'unknown',
					fullname: 'Unknown User',
					pinCode: null,
					isActive: true,
					isRoot: false,
					defaultLocationId: null,
					assignments: [],
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleUpdate(999, updateData, actorId)).rejects.toThrow(
					new NotFoundError('User with ID 999 not found', 'USER_NOT_FOUND')
				)
			})
		})

		describe('handleChangePassword', () => {
			it('should change password successfully', async () => {
				const changePasswordData: dto.UserChangePasswordDto = {
					oldPassword: 'oldpassword',
					newPassword: 'newpassword123',
				}

				const actorId = 1
				const userId = 1
				const existingPasswordHash = await Bun.password.hash('oldpassword')

				spyOn(fakeRepo, 'getPasswordHash').mockResolvedValue(existingPasswordHash)
				spyOn(fakeRepo, 'updatePassword').mockResolvedValue(1)

				const result = await service.handleChangePassword(userId, changePasswordData, actorId)

				expect(fakeRepo.getPasswordHash).toHaveBeenCalledWith(userId)
				expect(fakeRepo.updatePassword).toHaveBeenCalledWith(
					userId,
					expect.any(String),
					actorId
				)
				expect(result).toEqual({ id: userId })
			})

			it('should throw NotFoundError when user not found', async () => {
				const changePasswordData: dto.UserChangePasswordDto = {
					oldPassword: 'oldpassword',
					newPassword: 'newpassword123',
				}

				const actorId = 1
				const userId = 999

				spyOn(fakeRepo, 'getPasswordHash').mockResolvedValue(null)

				await expect(service.handleChangePassword(userId, changePasswordData, actorId)).rejects.toThrow(
					new NotFoundError('User with ID 999 not found', 'USER_NOT_FOUND')
				)
			})

			it('should throw error when old password mismatch', async () => {
				const changePasswordData: dto.UserChangePasswordDto = {
					oldPassword: 'wrongpassword',
					newPassword: 'newpassword123',
				}

				const actorId = 1
				const userId = 1
				const existingPasswordHash = await Bun.password.hash('correctpassword')

				spyOn(fakeRepo, 'getPasswordHash').mockResolvedValue(existingPasswordHash)

				await expect(service.handleChangePassword(userId, changePasswordData, actorId)).rejects.toThrow(
					new NotFoundError('Old password does not match', 'USER_PASSWORD_MISMATCH')
				)
			})
		})

		describe('handleAdminUpdatePassword', () => {
			it('should update password as admin successfully', async () => {
				const adminPasswordData: dto.UserAdminUpdatePasswordDto = {
					id: 1,
					password: 'newadminpassword123',
				}

				const actorId = 1

				spyOn(fakeRepo, 'updatePassword').mockResolvedValue(1)

				const result = await service.handleAdminUpdatePassword(adminPasswordData, actorId)

				expect(fakeRepo.updatePassword).toHaveBeenCalledWith(
					adminPasswordData.id,
					expect.any(String),
					actorId
				)
				expect(result).toEqual({ id: adminPasswordData.id })
			})
		})

		describe('handleRemove', () => {
			it('should remove user successfully', async () => {
				const userId = 1

				spyOn(fakeRepo, 'remove').mockResolvedValue(userId)

				const result = await service.handleRemove(userId)

				expect(fakeRepo.remove).toHaveBeenCalledWith(userId)
				expect(result).toEqual({ id: userId })
			})

			it('should throw NotFoundError when removing non-existent user', async () => {
				const userId = 999

				spyOn(fakeRepo, 'remove').mockResolvedValue(undefined)

				await expect(service.handleRemove(userId)).rejects.toThrow(
					new NotFoundError('User with ID 999 not found', 'USER_NOT_FOUND')
				)
			})
		})
	})

	/* ==================== DTO VALIDATION TESTS ==================== */
	describe('User DTO Validation', () => {
		describe('UserDto', () => {
			it('should validate correct user data', () => {
				const validData = {
					id: 1,
					email: 'john@example.com',
					username: 'john',
					fullname: 'John Doe',
					pinCode: null,
					isRoot: false,
					isSystem: false,
					isActive: true,
					defaultLocationId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const result = dto.UserDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid user data', () => {
				const invalidData = {
					id: 'invalid',
					email: 'invalid-email',
					username: '',
					// missing required fields
				}

				const result = dto.UserDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('UserCreateDto', () => {
			it('should validate correct create data', () => {
				const validData = {
					email: 'new@example.com',
					username: 'newuser',
					fullname: 'New User',
					pinCode: null,
					isActive: true,
					isRoot: false,
					defaultLocationId: null,
					password: 'password123',
					assignments: [],
				}

				const result = dto.UserCreateDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid create data', () => {
				const invalidData = {
					email: 'invalid-email',
					username: '', // empty username
					password: '123', // too short
				}

				const result = dto.UserCreateDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('UserFilterDto', () => {
			it('should validate correct filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					q: 'john',
					isActive: true,
					isRoot: false,
					locationId: 1,
				}

				const result = dto.UserFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should accept minimal filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					q: undefined,
					isActive: true,
					isRoot: false,
				}

				const result = dto.UserFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})
		})

		describe('UserChangePasswordDto', () => {
			it('should validate correct password change data', () => {
				const validData = {
					oldPassword: 'oldpassword123',
					newPassword: 'newpassword123',
				}

				const result = dto.UserChangePasswordDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid password change data', () => {
				const invalidData = {
					oldPassword: '123', // too short
					newPassword: '123', // too short
				}

				const result = dto.UserChangePasswordDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})
	})

	/* ==================== INTEGRATION TESTS ==================== */
	describe('User Integration Tests', () => {
		it('should handle complete user lifecycle', async () => {
			// Create
			const createData: dto.UserCreateDto = {
				email: 'integration@example.com',
				username: 'integration',
				fullname: 'Integration User',
				pinCode: null,
				isActive: true,
				isRoot: false,
				defaultLocationId: null,
				password: 'password123',
				assignments: [{ locationId: 1, roleId: 1 }],
			}

			const actorId = 1
			const newUserId = 456

			spyOn(fakeRepo, 'create').mockResolvedValue(newUserId)
			spyOn(mockServices.assignment, 'handleReplaceBulkByUserId').mockResolvedValue(undefined)

			const createResult = await service.handleCreate(createData, actorId)
			expect(createResult).toEqual({ id: newUserId })

			// Read
			const mockUser: dto.UserDto = {
				id: newUserId,
				email: createData.email,
				username: createData.username,
				fullname: createData.fullname,
				pinCode: createData.pinCode,
				isRoot: createData.isRoot,
				isSystem: false,
				isActive: createData.isActive,
				defaultLocationId: createData.defaultLocationId,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: actorId,
				updatedBy: actorId,
			}

			spyOn(service, 'getById').mockResolvedValue(mockUser)
			spyOn(service as any, 'buildUserAssignments').mockResolvedValue([])

			const readResult = await service.handleDetail(newUserId)
			expect(readResult).toHaveProperty('assignments')

			// Update
			const updateData: dto.UserUpdateDto = {
				id: newUserId,
				email: 'updated@example.com',
				username: 'integration',
				fullname: 'Integration User Updated',
				pinCode: null,
				isActive: true,
				isRoot: false,
				defaultLocationId: null,
				assignments: [],
			}

			spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const updateResult = await service.handleUpdate(newUserId, updateData, actorId)
			expect(updateResult).toEqual({ id: newUserId })

			// Delete
			spyOn(fakeRepo, 'remove').mockResolvedValue(newUserId)

			const deleteResult = await service.handleRemove(newUserId)
			expect(deleteResult).toEqual({ id: newUserId })
		})

		it('should handle cache integration correctly', async () => {
			const mockUser: dto.UserDto = {
				id: 1,
				email: 'john@example.com',
				username: 'john',
				fullname: 'John Doe',
				pinCode: null,
				isRoot: false,
				isSystem: false,
				isActive: true,
				defaultLocationId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1,
				updatedBy: 1,
			}

			spyOn(mockCache, 'getOrSet').mockImplementation(async ({ factory }: { factory: () => Promise<any> }) => {
				return await factory()
			})
			spyOn(fakeRepo, 'getById').mockResolvedValue(mockUser)

			const result = await service.getById(1)

			expect(mockCache.getOrSet).toHaveBeenCalledWith({
				key: CACHE_KEY_DEFAULT.byId(1),
				factory: expect.any(Function),
			})
			expect(result).toEqual(mockUser)
		})
	})
})
