import { beforeEach, describe, expect, it, mock, spyOn, vi } from 'bun:test'

import { UserAssignmentService } from './assignment/assignment.service'
import { UserAssignmentRepo } from './assignment/assignment.repo'
import * as dto from './assignment/assignment.dto'

// Mock constants
vi.mock('../constants', () => ({
	IAM_CONFIG: {
		SUPERADMIN_PLACEHOLDER_ID: 999999,
		CACHE_TTL_SHORT: 300,
		CACHE_TTL_LONG: 3600,
	},
	SYSTEM_ROLES: {
		SUPERADMIN_ID: 1,
	},
}))

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

describe('Assignment Domain Tests', () => {
	let service: UserAssignmentService
	let fakeRepo: UserAssignmentRepo
	let mockCache: any

	beforeEach(() => {
		fakeRepo = {
			getList: mock(),
			getListPaginated: mock(),
			getListByUserIds: mock(),
			replaceBulkByUserId: mock(),
			replaceBulkByUserIds: mock(),
			removeByUserAndLocation: mock(),
			removeUsersBulkFromLocation: mock(),
			updateRoleBulkByLocation: mock(),
		} as any

		mockCache = {
			getOrSet: mock(),
			deleteMany: mock(),
		}

		// Setup mock for bento.namespace
		const mockNamespace = mock(() => mockCache)
		;(bento as any).namespace = mockNamespace

		service = new UserAssignmentService(fakeRepo)
	})

	/* ==================== SERVICE LAYER TESTS ==================== */
	describe('UserAssignmentService', () => {
		describe('getDefaultAssignmentForSuperadmin', () => {
			it('should return default superadmin assignment', () => {
				const result = service.getDefaultAssignmentForSuperadmin()

				expect(result).toEqual({
					id: 999999, // IAM_CONFIG.SUPERADMIN_PLACEHOLDER_ID
					userId: 999999,
					roleId: 1, // SYSTEM_ROLES.SUPERADMIN_ID
					locationId: 999999,
					addedAt: expect.any(Date),
					addedBy: 999999,
				})
			})
		})

		describe('findByUserId', () => {
			it('should return assignments for user', async () => {
				const mockAssignments: dto.UserAssignmentDto[] = [
					{
						id: 1,
						userId: 1,
						roleId: 2,
						locationId: 1,
						addedAt: new Date(),
						addedBy: 1,
					},
					{
						id: 2,
						userId: 1,
						roleId: 3,
						locationId: 2,
						addedAt: new Date(),
						addedBy: 1,
					},
				]

				spyOn(fakeRepo, 'getList').mockResolvedValue(mockAssignments)

				const result = await service.findByUserId(1)

				expect(fakeRepo.getList).toHaveBeenCalledWith({ userId: 1 })
				expect(result).toEqual(mockAssignments)
			})

			it('should return empty array for user with no assignments', async () => {
				spyOn(fakeRepo, 'getList').mockResolvedValue([])

				const result = await service.findByUserId(999)

				expect(fakeRepo.getList).toHaveBeenCalledWith({ userId: 999 })
				expect(result).toEqual([])
			})
		})

		describe('handleGetList', () => {
			it('should return filtered assignments', async () => {
				const filter = { userId: 1, roleId: 2 }
				const mockAssignments: dto.UserAssignmentDto[] = [
					{
						id: 1,
						userId: 1,
						roleId: 2,
						locationId: 1,
						addedAt: new Date(),
						addedBy: 1,
					},
				]

				spyOn(fakeRepo, 'getList').mockResolvedValue(mockAssignments)

				const result = await service.handleGetList(filter)

				expect(fakeRepo.getList).toHaveBeenCalledWith(filter)
				expect(result).toEqual(mockAssignments)
			})
		})

		describe('handleGetListPaginated', () => {
			it('should return paginated assignments', async () => {
				const filter: dto.UserAssignmentFilterDto = { page: 1, limit: 10, userId: 1 }
				const mockPaginatedResult = {
					data: [
						{
							id: 1,
							userId: 1,
							roleId: 2,
							locationId: 1,
							addedAt: new Date(),
							addedBy: 1,
						},
					],
					meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
				}

				spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)

				const result = await service.handleGetListPaginated(filter)

				expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
				expect(result).toEqual(mockPaginatedResult)
			})
		})

		describe('handleReplaceBulkByUserId', () => {
			it('should replace user assignments', async () => {
				const userId = 1
				const assignments: dto.UserAssignmentUpsertDto[] = [
					{ userId, roleId: 2, locationId: 1 },
					{ userId, roleId: 3, locationId: 2 },
				]
				const actorId = 1

				spyOn(fakeRepo, 'replaceBulkByUserId').mockResolvedValue(undefined)

				await service.handleReplaceBulkByUserId(userId, assignments, actorId)

				expect(fakeRepo.replaceBulkByUserId).toHaveBeenCalledWith(userId, assignments, actorId)
			})
		})

		describe('handleAssignToLocation', () => {
			it('should assign user to new location', async () => {
				const data = { userId: 1, roleId: 2, locationId: 3 }
				const actorId = 1
				const existingAssignments: dto.UserAssignmentDto[] = [
					{
						id: 1,
						userId: 1,
						roleId: 2,
						locationId: 1,
						addedAt: new Date(),
						addedBy: 1,
					},
				]

				spyOn(fakeRepo, 'getList').mockResolvedValue(existingAssignments)
				spyOn(fakeRepo, 'replaceBulkByUserId').mockResolvedValue(undefined)

				await service.handleAssignToLocation(data, actorId)

				expect(fakeRepo.getList).toHaveBeenCalledWith({ userId: 1 })
				expect(fakeRepo.replaceBulkByUserId).toHaveBeenCalledWith(
					1,
					[
						{ userId: 1, roleId: 2, locationId: 1 },
						{ userId: 1, roleId: 2, locationId: 3 },
					],
					actorId
				)
			})

			it('should update existing location assignment', async () => {
				const data = { userId: 1, roleId: 3, locationId: 1 }
				const actorId = 1
				const existingAssignments: dto.UserAssignmentDto[] = [
					{
						id: 1,
						userId: 1,
						roleId: 2,
						locationId: 1,
						addedAt: new Date(),
						addedBy: 1,
					},
				]

				spyOn(fakeRepo, 'getList').mockResolvedValue(existingAssignments)
				spyOn(fakeRepo, 'replaceBulkByUserId').mockResolvedValue(undefined)

				await service.handleAssignToLocation(data, actorId)

				expect(fakeRepo.replaceBulkByUserId).toHaveBeenCalledWith(
					1,
					[{ userId: 1, roleId: 3, locationId: 1 }],
					actorId
				)
			})
		})

		describe('handleRemoveFromLocation', () => {
			it('should remove user from location', async () => {
				const userId = 1
				const locationId = 1

				spyOn(fakeRepo, 'removeByUserAndLocation').mockResolvedValue(undefined)

				await service.handleRemoveFromLocation(userId, locationId)

				expect(fakeRepo.removeByUserAndLocation).toHaveBeenCalledWith(userId, locationId)
			})
		})

		describe('handleRemoveUsersFromLocation', () => {
			it('should remove multiple users from location', async () => {
				const userIds = [1, 2, 3]
				const locationId = 1

				spyOn(fakeRepo, 'removeUsersBulkFromLocation').mockResolvedValue(undefined)

				await service.handleRemoveUsersFromLocation(userIds, locationId)

				expect(fakeRepo.removeUsersBulkFromLocation).toHaveBeenCalledWith(userIds, locationId)
			})
		})

		describe('handleAssignUsersToLocation', () => {
			it('should assign multiple users to location with same role', async () => {
				const userIds = [1, 2]
				const locationId = 1
				const roleId = 2
				const actorId = 1
				const existingAssignments: dto.UserAssignmentDto[] = [
					{
						id: 1,
						userId: 1,
						roleId: 3,
						locationId: 2,
						addedAt: new Date(),
						addedBy: 1,
					},
				]

				spyOn(fakeRepo, 'getListByUserIds').mockResolvedValue(existingAssignments)
				spyOn(fakeRepo, 'replaceBulkByUserIds').mockResolvedValue(undefined)

				await service.handleAssignUsersToLocation(userIds, locationId, roleId, actorId)

				expect(fakeRepo.getListByUserIds).toHaveBeenCalledWith(userIds)
				expect(fakeRepo.replaceBulkByUserIds).toHaveBeenCalledWith(
					userIds,
					expect.any(Map),
					actorId
				)
			})

			it('should not add duplicate location assignments', async () => {
				const userIds = [1]
				const locationId = 1
				const roleId = 2
				const actorId = 1
				const existingAssignments: dto.UserAssignmentDto[] = [
					{
						id: 1,
						userId: 1,
						roleId: 2,
						locationId: 1,
						addedAt: new Date(),
						addedBy: 1,
					},
				]

				spyOn(fakeRepo, 'getListByUserIds').mockResolvedValue(existingAssignments)
				spyOn(fakeRepo, 'replaceBulkByUserIds').mockResolvedValue(undefined)

				await service.handleAssignUsersToLocation(userIds, locationId, roleId, actorId)

				const assignmentsForUser1 = [
					{ userId: 1, roleId: 2, locationId: 1 },
				]

				expect(fakeRepo.replaceBulkByUserIds).toHaveBeenCalledWith(
					userIds,
					new Map([[1, assignmentsForUser1]]),
					actorId
				)
			})
		})

		describe('handleUpdateRoleForUsersInLocation', () => {
			it('should update role for multiple users in location', async () => {
				const userIds = [1, 2, 3]
				const locationId = 1
				const roleId = 2
				const actorId = 1

				spyOn(fakeRepo, 'updateRoleBulkByLocation').mockResolvedValue(undefined)

				await service.handleUpdateRoleForUsersInLocation(userIds, locationId, roleId, actorId)

				expect(fakeRepo.updateRoleBulkByLocation).toHaveBeenCalledWith(userIds, locationId, roleId, actorId)
			})
		})
	})

	/* ==================== DTO VALIDATION TESTS ==================== */
	describe('Assignment DTO Validation', () => {
		describe('UserAssignmentDto', () => {
			it('should validate correct assignment data', () => {
				const validData = {
					id: 1,
					userId: 1,
					roleId: 2,
					locationId: 1,
					addedAt: new Date(),
					addedBy: 1,
				}

				const result = dto.UserAssignmentDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid assignment data', () => {
				const invalidData = {
					id: 'invalid',
					userId: 'invalid',
					roleId: 'invalid',
					locationId: 'invalid',
					// missing required fields
				}

				const result = dto.UserAssignmentDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('UserAssignmentFilterDto', () => {
			it('should validate correct filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					userId: 1,
					roleId: 2,
					locationId: 1,
				}

				const result = dto.UserAssignmentFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should accept minimal filter data', () => {
				const validData = {
					page: 1,
					limit: 10,
					userId: undefined,
					roleId: undefined,
					locationId: undefined,
				}

				const result = dto.UserAssignmentFilterDto.safeParse(validData)
				expect(result.success).toBe(true)
			})
		})

		describe('UserAssignmentUpsertDto', () => {
			it('should validate correct upsert data', () => {
				const validData = {
					userId: 1,
					roleId: 2,
					locationId: 1,
				}

				const result = dto.UserAssignmentUpsertDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid upsert data', () => {
				const invalidData = {
					userId: 'invalid',
					roleId: 'invalid',
					locationId: 'invalid',
				}

				const result = dto.UserAssignmentUpsertDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('AssignmentBulkBodyDto', () => {
			it('should validate correct bulk assignment data', () => {
				const validData = {
					userIds: [1, 2, 3],
					locationId: 1,
					roleId: 2,
				}

				const result = dto.AssignmentBulkBodyDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid bulk assignment data', () => {
				const invalidData = {
					userIds: ['invalid'],
					locationId: 'invalid',
					roleId: 'invalid',
				}

				const result = dto.AssignmentBulkBodyDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('AssignmentRemoveBodyDto', () => {
			it('should validate correct remove assignment data', () => {
				const validData = {
					userId: 1,
					locationId: 1,
				}

				const result = dto.AssignmentRemoveBodyDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid remove assignment data', () => {
				const invalidData = {
					userId: 'invalid',
					locationId: 'invalid',
				}

				const result = dto.AssignmentRemoveBodyDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})

		describe('AssignmentRemoveBulkBodyDto', () => {
			it('should validate correct bulk remove data', () => {
				const validData = {
					userIds: [1, 2, 3],
					locationId: 1,
				}

				const result = dto.AssignmentRemoveBulkBodyDto.safeParse(validData)
				expect(result.success).toBe(true)
			})

			it('should reject invalid bulk remove data', () => {
				const invalidData = {
					userIds: ['invalid'],
					locationId: 'invalid',
				}

				const result = dto.AssignmentRemoveBulkBodyDto.safeParse(invalidData)
				expect(result.success).toBe(false)
			})
		})
	})

	/* ==================== INTEGRATION TESTS ==================== */
	describe('Assignment Integration Tests', () => {
		it('should handle complete assignment lifecycle', async () => {
			const userId = 1
			const actorId = 1

			// Initial assignments
			const initialAssignments: dto.UserAssignmentDto[] = [
				{
					id: 1,
					userId,
					roleId: 2,
					locationId: 1,
					addedAt: new Date(),
					addedBy: actorId,
				},
			]

			// Read initial assignments
			spyOn(fakeRepo, 'getList').mockResolvedValue(initialAssignments)
			const readResult = await service.findByUserId(userId)
			expect(readResult).toEqual(initialAssignments)

			// Assign to new location
			const newAssignmentData = { userId, roleId: 3, locationId: 2 }
			spyOn(fakeRepo, 'getList').mockResolvedValue(initialAssignments)
			spyOn(fakeRepo, 'replaceBulkByUserId').mockResolvedValue(undefined)

			await service.handleAssignToLocation(newAssignmentData, actorId)
			expect(fakeRepo.replaceBulkByUserId).toHaveBeenCalledWith(
				userId,
				[
					{ userId, roleId: 2, locationId: 1 },
					{ userId, roleId: 3, locationId: 2 },
				],
				actorId
			)

			// Update role in location
			spyOn(fakeRepo, 'updateRoleBulkByLocation').mockResolvedValue(undefined)
			await service.handleUpdateRoleForUsersInLocation([userId], 2, 4, actorId)
			expect(fakeRepo.updateRoleBulkByLocation).toHaveBeenCalledWith([userId], 2, 4, actorId)

			// Remove from location
			spyOn(fakeRepo, 'removeByUserAndLocation').mockResolvedValue(undefined)
			await service.handleRemoveFromLocation(userId, 1)
			expect(fakeRepo.removeByUserAndLocation).toHaveBeenCalledWith(userId, 1)
		})

		it('should handle bulk operations correctly', async () => {
			const userIds = [1, 2, 3]
			const locationId = 1
			const roleId = 2
			const actorId = 1

			// Bulk assign users to location
			const existingAssignments: dto.UserAssignmentDto[] = []
			spyOn(fakeRepo, 'getListByUserIds').mockResolvedValue(existingAssignments)
			spyOn(fakeRepo, 'replaceBulkByUserIds').mockResolvedValue(undefined)

			await service.handleAssignUsersToLocation(userIds, locationId, roleId, actorId)

			const expectedAssignments = new Map([
				[1, [{ userId: 1, roleId, locationId }]],
				[2, [{ userId: 2, roleId, locationId }]],
				[3, [{ userId: 3, roleId, locationId }]],
			])

			expect(fakeRepo.replaceBulkByUserIds).toHaveBeenCalledWith(userIds, expectedAssignments, actorId)

			// Bulk remove users from location
			spyOn(fakeRepo, 'removeUsersBulkFromLocation').mockResolvedValue(undefined)
			await service.handleRemoveUsersFromLocation(userIds, locationId)
			expect(fakeRepo.removeUsersBulkFromLocation).toHaveBeenCalledWith(userIds, locationId)
		})

		it('should handle cache integration correctly', async () => {
			const mockAssignments: dto.UserAssignmentDto[] = [
				{
					id: 1,
					userId: 1,
					roleId: 2,
					locationId: 1,
					addedAt: new Date(),
					addedBy: 1,
				},
			]

			spyOn(mockCache, 'getOrSet').mockImplementation(async ({ factory }: { factory: () => Promise<any> }) => {
				return await factory()
			})
			spyOn(fakeRepo, 'getList').mockResolvedValue(mockAssignments)

			const result = await service.findByUserId(1)

			expect(mockCache.getOrSet).toHaveBeenCalledWith({
				key: CACHE_KEY_DEFAULT.byId(1),
				factory: expect.any(Function),
			})
			expect(result).toEqual(mockAssignments)
		})

		it('should handle superadmin default assignment', () => {
			const result = service.getDefaultAssignmentForSuperadmin()

			expect(result.userId).toBe(999999)
			expect(result.roleId).toBe(1) // SUPERADMIN_ID
			expect(result.locationId).toBe(999999)
			expect(result.addedBy).toBe(999999)
			expect(result.addedAt).toBeInstanceOf(Date)
		})
	})
})
