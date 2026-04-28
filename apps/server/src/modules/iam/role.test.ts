import { beforeEach, describe, expect, it, mock, spyOn, vi } from 'bun:test'

import { RoleService } from './role/role.service'
import { RoleRepo } from './role/role.repo'
import { NotFoundError } from '@/core/http/errors'
import * as dto from './role/role.dto'

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

describe('Role Domain Tests', () => {
	let service: RoleService
	let fakeRepo: RoleRepo
	let mockCache: any

	beforeEach(() => {
		fakeRepo = {
			getById: mock(),
			getList: mock(),
			getListPaginated: mock(),
			count: mock(),
			seed: mock(),
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

		service = new RoleService(fakeRepo)
	})

	/* ==================== SERVICE LAYER TESTS ==================== */
	describe('RoleService', () => {
		describe('getById', () => {
			it('should return role when found', async () => {
				const mockRole: dto.RoleDto = {
					id: 1,
					code: 'ADMIN',
					name: 'Administrator',
					description: 'System administrator',
					permissions: ['user:read', 'user:write'],
					isSystem: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(fakeRepo, 'getById').mockResolvedValue(mockRole)

				const result = await service.getById(1)

				expect(fakeRepo.getById).toHaveBeenCalledWith(1)
				expect(result).toEqual(mockRole)
			})

			it('should return undefined when role not found', async () => {
				spyOn(fakeRepo, 'getById').mockResolvedValue(undefined)

				const result = await service.getById(999)

				expect(result).toBeUndefined()
			})
		})

		describe('getList', () => {
			it('should return list of roles', async () => {
				const mockRoles: dto.RoleDto[] = [
					{
						id: 1,
						code: 'ADMIN',
						name: 'Administrator',
						description: 'System administrator',
						permissions: ['user:read', 'user:write'],
						isSystem: false,
						createdAt: new Date(),
						updatedAt: new Date(),
						createdBy: 1,
						updatedBy: 1,
					},
					{
						id: 2,
						code: 'USER',
						name: 'User',
						description: 'Regular user',
						permissions: ['profile:read'],
						isSystem: false,
						createdAt: new Date(),
						updatedAt: new Date(),
						createdBy: 1,
						updatedBy: 1,
					},
				]

				spyOn(fakeRepo, 'getList').mockResolvedValue(mockRoles)

				const result = await service.getList()

				expect(fakeRepo.getList).toHaveBeenCalled()
				expect(result).toEqual(mockRoles)
			})
		})

		describe('getRelationMap', () => {
			it('should return relation map of roles', async () => {
				const mockRoles: dto.RoleDto[] = [
					{
						id: 1,
						code: 'ADMIN',
						name: 'Administrator',
						description: 'System administrator',
						permissions: ['user:read', 'user:write'],
						isSystem: false,
						createdAt: new Date(),
						updatedAt: new Date(),
						createdBy: 1,
						updatedBy: 1,
					},
				]

				spyOn(fakeRepo, 'getList').mockResolvedValue(mockRoles)

				const result = await service.getRelationMap()

				expect(fakeRepo.getList).toHaveBeenCalled()
				expect(result).toBeDefined()
				expect(result.get(1)).toEqual(mockRoles[0])
			})
		})

		describe('getSuperadmin', () => {
			it('should return superadmin role', async () => {
				const mockSuperadminRole: dto.RoleDto = {
					id: 1,
					code: 'SUPERADMIN',
					name: 'Super Administrator',
					description: 'Super administrator',
					permissions: ['*'],
					isSystem: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(service, 'getById').mockResolvedValue(mockSuperadminRole)

				const result = await service.getSuperadmin()

				expect(service.getById).toHaveBeenCalledWith(1) // SYSTEM_ROLES.SUPERADMIN_ID
				expect(result).toEqual(mockSuperadminRole)
			})

			it('should throw NotFoundError when superadmin role not found', async () => {
				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.getSuperadmin()).rejects.toThrow(
					new NotFoundError('Role with ID 1 not found', 'ROLE_NOT_FOUND')
				)
			})
		})

		describe('handleList', () => {
			it('should return paginated list', async () => {
				const filter: dto.RoleFilterDto = { page: 1, limit: 10, q: undefined }
				const mockPaginatedResult = {
					data: [
						{
							id: 1,
							code: 'ADMIN',
							name: 'Administrator',
							description: 'System administrator',
							permissions: ['user:read', 'user:write'],
							isSystem: false,
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
			it('should return role detail when found', async () => {
				const mockRole: dto.RoleDto = {
					id: 1,
					code: 'ADMIN',
					name: 'Administrator',
					description: 'System administrator',
					permissions: ['user:read', 'user:write'],
					isSystem: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(service, 'getById').mockResolvedValue(mockRole)

				const result = await service.handleDetail(1)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(result).toEqual(mockRole)
			})

			it('should throw NotFoundError when role not found', async () => {
				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleDetail(999)).rejects.toThrow(
					new NotFoundError('Role with ID 999 not found', 'ROLE_NOT_FOUND')
				)
			})
		})

		describe('handleCreate', () => {
			it('should create role successfully', async () => {
				const createData: dto.RoleCreateDto = {
					code: 'TEST_MANAGER',
					name: 'Test Manager',
					description: 'Test department manager',
					permissions: ['team:read', 'team:write'],
					isSystem: false,
				}

				const actorId = 1
				const newRoleId = 123

				spyOn(fakeRepo, 'create').mockResolvedValue(newRoleId)

				const result = await service.handleCreate(createData, actorId)

				expect(fakeRepo.create).toHaveBeenCalledWith(createData, actorId)
				expect(result).toEqual({ id: newRoleId })
			})
		})

		describe('handleUpdate', () => {
			it('should update role successfully', async () => {
				const existingRole: dto.RoleDto = {
					id: 1,
					code: 'ADMIN',
					name: 'Administrator',
					description: 'System administrator',
					permissions: ['user:read', 'user:write'],
					isSystem: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const updateData: dto.RoleUpdateDto = {
					id: 1,
					code: 'ADMIN',
					name: 'Administrator Updated',
					description: 'Updated system administrator',
					permissions: ['user:read', 'user:write', 'admin:read'],
					isSystem: false,
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(existingRole)
				spyOn(fakeRepo, 'update').mockResolvedValue(1)

				const result = await service.handleUpdate(updateData, actorId)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(fakeRepo.update).toHaveBeenCalledWith(updateData, actorId)
				expect(result).toEqual({ id: 1 })
			})

			it('should throw NotFoundError when updating non-existent role', async () => {
				const updateData: dto.RoleUpdateDto = {
					id: 999,
					code: 'UNKNOWN',
					name: 'Unknown Role',
					description: 'Unknown role',
					permissions: [],
					isSystem: false,
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleUpdate(updateData, actorId)).rejects.toThrow(
					new NotFoundError('Role with ID 999 not found', 'ROLE_NOT_FOUND')
				)
			})

			it('should throw error when updating system role', async () => {
				const existingSystemRole: dto.RoleDto = {
					id: 1,
					code: 'SYSTEM',
					name: 'System Role',
					description: 'System role',
					permissions: ['*'],
					isSystem: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const updateData: dto.RoleUpdateDto = {
					id: 1,
					code: 'SYSTEM',
					name: 'Updated System Role',
					description: 'Updated system role',
					permissions: ['*'],
					isSystem: true,
				}

				const actorId = 1

				spyOn(service, 'getById').mockResolvedValue(existingSystemRole)

				await expect(service.handleUpdate(updateData, actorId)).rejects.toThrow(
					new NotFoundError('Cannot update system role', 'ROLE_UPDATE_SYSTEM_ROLE')
				)
			})
		})

		describe('handleRemove', () => {
			it('should remove role successfully', async () => {
				const existingRole: dto.RoleDto = {
					id: 1,
					code: 'ADMIN',
					name: 'Administrator',
					description: 'System administrator',
					permissions: ['user:read', 'user:write'],
					isSystem: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(service, 'getById').mockResolvedValue(existingRole)
				spyOn(fakeRepo, 'remove').mockResolvedValue(1)

				const result = await service.handleRemove(1)

				expect(service.getById).toHaveBeenCalledWith(1)
				expect(fakeRepo.remove).toHaveBeenCalledWith(1)
				expect(result).toEqual({ id: 1 })
			})

			it('should throw NotFoundError when removing non-existent role', async () => {
				spyOn(service, 'getById').mockResolvedValue(undefined)

				await expect(service.handleRemove(999)).rejects.toThrow(
					new NotFoundError('Role with ID 999 not found', 'ROLE_NOT_FOUND')
				)
			})

			it('should throw error when removing system role', async () => {
				const existingSystemRole: dto.RoleDto = {
					id: 1,
					code: 'SYSTEM',
					name: 'System Role',
					description: 'System role',
					permissions: ['*'],
					isSystem: true,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				spyOn(service, 'getById').mockResolvedValue(existingSystemRole)

				await expect(service.handleRemove(1)).rejects.toThrow(
					new NotFoundError('Cannot delete system role', 'ROLE_DELETE_SYSTEM_ROLE')
				)
			})
		})
	})

	/* ==================== DTO VALIDATION TESTS ==================== */
	describe('Role DTO Validation', () => {
		describe('RoleDto', () => {
			it('should validate correct role data', () => {
				const validData = {
					id: 1,
					code: 'ADMIN',
					name: 'Administrator',
					description: 'System administrator',
					permissions: ['user:read', 'user:write'],
					isSystem: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					createdBy: 1,
					updatedBy: 1,
				}

				const result = dto.RoleDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid role data', () => {
				const invalidData = {
					id: 'invalid',
					code: '', // empty code
					name: '', // empty name
					// missing required fields
				}

				const result = dto.RoleDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('RoleCreateDto', () => {
			it('should validate correct create data', () => {
				const validData = {
					code: 'MANAGER',
					name: 'Manager',
					description: 'Department manager',
					permissions: ['team:read', 'team:write'],
					isSystem: false,
				}

				const result = dto.RoleCreateDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid create data', () => {
				const invalidData = {
					code: 'A', // too short
					name: '', // empty name
				}

				const result = dto.RoleCreateDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})

			it('should transform code to uppercase', () => {
				const validData = {
					code: 'manager',
					name: 'Manager',
					description: 'Department manager',
					permissions: ['team:read'],
					isSystem: false,
				}

				const result = dto.RoleCreateDto.safeParse(validData)
				if (result.success) {
					expect(result.data.code).toBe('MANAGER')
				}
			})
		})

		describe('RoleFilterDto', () => {
			it('should validate correct filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					q: 'admin',
				}

				const result = dto.RoleFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should accept minimal filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					q: undefined,
				}

				const result = dto.RoleFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})
		})
	})

	/* ==================== INTEGRATION TESTS ==================== */
	describe('Role Integration Tests', () => {
		it('should handle complete role lifecycle', async () => {
			// Create
			const createData: dto.RoleCreateDto = {
				code: 'TEST',
				name: 'Test Role',
				description: 'Test role description',
				permissions: ['test:read', 'test:write'],
				isSystem: false,
			}

			const actorId = 1
			const newRoleId = 456

			spyOn(fakeRepo, 'create').mockResolvedValue(newRoleId)

			const createResult = await service.handleCreate(createData, actorId)
			expect(createResult).toEqual({ id: newRoleId })

			// Read
			const mockRole: dto.RoleDto = {
				id: newRoleId,
				code: createData.code,
				name: createData.name,
				description: createData.description,
				permissions: createData.permissions,
				isSystem: createData.isSystem,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: actorId,
				updatedBy: actorId,
			}

			spyOn(service, 'getById').mockResolvedValue(mockRole)

			const readResult = await service.handleDetail(newRoleId)
			expect(readResult).toEqual(mockRole)

			// Update
			const updateData: dto.RoleUpdateDto = {
				id: newRoleId,
				code: 'TEST',
				name: 'Test Role Updated',
				description: 'Updated test role description',
				permissions: ['test:read', 'test:write', 'test:admin'],
				isSystem: false,
			}

			spyOn(service, 'getById').mockResolvedValue(mockRole)
			spyOn(fakeRepo, 'update').mockResolvedValue(1)

			const updateResult = await service.handleUpdate(updateData, actorId)
			expect(updateResult).toEqual({ id: newRoleId })

			// Delete
			spyOn(service, 'getById').mockResolvedValue(mockRole)
			spyOn(fakeRepo, 'remove').mockResolvedValue(newRoleId)

			const deleteResult = await service.handleRemove(newRoleId)
			expect(deleteResult).toEqual({ id: newRoleId })
		})

		it('should handle cache integration correctly', async () => {
			const mockRole: dto.RoleDto = {
				id: 1,
				code: 'ADMIN',
				name: 'Administrator',
				description: 'System administrator',
				permissions: ['user:read', 'user:write'],
				isSystem: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1,
				updatedBy: 1,
			}

			spyOn(mockCache, 'getOrSet').mockImplementation(async ({ factory }: { factory: () => Promise<any> }) => {
				return await factory()
			})
			spyOn(fakeRepo, 'getById').mockResolvedValue(mockRole)

			const result = await service.getById(1)

			expect(mockCache.getOrSet).toHaveBeenCalledWith({
				key: CACHE_KEY_DEFAULT.byId(1),
				factory: expect.any(Function),
			})
			expect(result).toEqual(mockRole)
		})

		it('should handle permission-based operations', async () => {
			const roleWithPermissions: dto.RoleDto = {
				id: 1,
				code: 'EDITOR',
				name: 'Editor',
				description: 'Content editor',
				permissions: ['content:read', 'content:write', 'content:publish'],
				isSystem: false,
				createdAt: new Date(),
				updatedAt: new Date(),
				createdBy: 1,
				updatedBy: 1,
			}

			spyOn(service, 'getById').mockResolvedValue(roleWithPermissions)

			const result = await service.getById(1)

			expect(result?.permissions).toContain('content:write')
			expect(result?.permissions).toContain('content:publish')
			expect(result?.permissions).toHaveLength(3)
		})
	})
})
