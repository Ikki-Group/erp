import { beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { UserAssignmentService } from './assignment.service'
import { UserAssignmentRepo } from './assignment.repo'
import * as dto from './assignment.dto'

describe('UserAssignmentService', () => {
	let service: UserAssignmentService
	let fakeRepo: UserAssignmentRepo

	beforeEach(() => {
		fakeRepo = {
			getList: spyOn(),
			getListPaginated: spyOn(),
			create: spyOn(),
			update: spyOn(),
			remove: spyOn(),
		} as any

		service = new UserAssignmentService(fakeRepo)
	})

	describe('getDefaultAssignmentForSuperadmin', () => {
		it('should return default superadmin assignment', () => {
			const result = service.getDefaultAssignmentForSuperadmin()

			expect(result).toEqual({
				id: -1,
				userId: -1,
				roleId: 1,
				locationId: -1,
				addedAt: expect.any(Date),
				addedBy: -1,
			})
		})
	})

	describe('findByUserId', () => {
		it('should return assignments for user', async () => {
			const mockAssignments: dto.UserAssignmentDto[] = [
				{
					id: 1,
					userId: 123,
					roleId: 2,
					locationId: 3,
					addedAt: new Date(),
					addedBy: 1,
				},
			]

			spyOn(fakeRepo, 'getList').mockResolvedValue(mockAssignments)

			const result = await service.findByUserId(123)

			expect(fakeRepo.getList).toHaveBeenCalledWith({ userId: 123 })
			expect(result).toEqual(mockAssignments)
		})
	})

	describe('handleGetList', () => {
		it('should return filtered list', async () => {
			const mockAssignments: dto.UserAssignmentDto[] = [
				{
					id: 1,
					userId: 123,
					roleId: 2,
					locationId: 3,
					addedAt: new Date(),
					addedBy: 1,
				},
			]

			const filter = { userId: 123 }
			spyOn(fakeRepo, 'getList').mockResolvedValue(mockAssignments)

			const result = await service.handleGetList(filter)

			expect(fakeRepo.getList).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockAssignments)
		})
	})

	describe('handleGetListPaginated', () => {
		it('should return paginated list', async () => {
			const mockPaginatedResult = {
				data: [
					{
						id: 1,
						userId: 123,
						roleId: 2,
						locationId: 3,
						addedAt: new Date(),
						addedBy: 1,
					},
				],
				meta: {
					page: 1,
					limit: 10,
					total: 1,
					totalPages: 1,
				},
			}

			const filter = { page: 1, limit: 10 }
			spyOn(fakeRepo, 'getListPaginated').mockResolvedValue(mockPaginatedResult)

			const result = await service.handleGetListPaginated(filter)

			expect(fakeRepo.getListPaginated).toHaveBeenCalledWith(filter)
			expect(result).toEqual(mockPaginatedResult)
		})
	})
})
