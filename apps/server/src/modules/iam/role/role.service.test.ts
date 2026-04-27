import { beforeEach, describe, expect, it } from 'bun:test'

import type { WithPaginationResult } from '@/core/database'
import { SYSTEM_ROLES } from '@/modules/iam/constants'

import * as dto from './role.dto'
import { RoleRepo } from './role.repo'
import { RoleService } from './role.service'

function createMockRole(overrides: Partial<dto.RoleDto> = {}): dto.RoleDto {
	return {
		id: 1,
		code: 'ADMIN',
		name: 'Administrator',
		description: null,
		permissions: [],
		isSystem: false,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		createdBy: 1,
		updatedBy: 1,
		...overrides,
	}
}

function createFakeRepo(overrides: Partial<RoleRepo> = {}): RoleRepo {
	return {
		getListPaginated: async () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
		getList: async () => [],
		getById: async () => undefined,
		count: async () => 0,
		create: async () => 1,
		update: async () => 1,
		remove: async () => 1,
		seed: async () => {},
		...overrides,
	} as RoleRepo
}

describe('RoleService', () => {
	let service: RoleService
	let fakeRepo: RoleRepo

	beforeEach(() => {
		fakeRepo = createFakeRepo()
		service = new RoleService(fakeRepo)
	})

	describe('getById', () => {
		it('delegates to repo and returns result when found', async () => {
			const role = createMockRole({ id: 1 })
			fakeRepo.getById = async () => role
			const result = await service.getById(1)
			expect(result).toEqual(role)
		})

		it('returns undefined when not found', async () => {
			fakeRepo.getById = async () => undefined
			const result = await service.getById(999)
			expect(result).toBeUndefined()
		})
	})

	describe('getSuperadmin', () => {
		it('returns superadmin when found', async () => {
			const superadmin = createMockRole({ id: SYSTEM_ROLES.SUPERADMIN_ID, code: 'SUPERADMIN', isSystem: true })
			fakeRepo.getById = async (id) => (id === SYSTEM_ROLES.SUPERADMIN_ID ? superadmin : undefined)

			const result = await service.getSuperadmin()
			expect(result.id).toBe(SYSTEM_ROLES.SUPERADMIN_ID)
			expect(result.isSystem).toBe(true)
		})

		it('throws ROLE_NOT_FOUND when superadmin missing', async () => {
			fakeRepo.getById = async () => undefined
			try {
				await service.getSuperadmin()
				expect(false).toBe(true)
			} catch (error: unknown) {
				expect((error as { code: string }).code).toBe('ROLE_NOT_FOUND')
			}
		})
	})

	describe('handleDetail', () => {
		it('returns result when found', async () => {
			const role = createMockRole({ id: 1 })
			fakeRepo.getById = async () => role
			const result = await service.handleDetail(1)
			expect(result).toEqual(role)
		})

		it('throws ROLE_NOT_FOUND when missing', async () => {
			fakeRepo.getById = async () => undefined
			try {
				await service.handleDetail(999)
				expect(false).toBe(true)
			} catch (error: unknown) {
				expect((error as { code: string }).code).toBe('ROLE_NOT_FOUND')
			}
		})
	})

	describe('handleList', () => {
		it('delegates pagination filter to repo', async () => {
			const mockResult: WithPaginationResult<dto.RoleDto> = {
				data: [createMockRole()],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}
			fakeRepo.getListPaginated = async () => mockResult

			const filter: dto.RoleFilterDto = { q: undefined, page: 1, limit: 10 }
			const result = await service.handleList(filter)

			expect(result.data).toHaveLength(1)
			expect(result.meta.total).toBe(1)
		})
	})

	describe('getList', () => {
		it('delegates to repo', async () => {
			const roles = [createMockRole({ id: 1 }), createMockRole({ id: 2 })]
			fakeRepo.getList = async () => roles
			const result = await service.getList()
			expect(result).toHaveLength(2)
		})
	})

	describe('getRelationMap', () => {
		it('creates relation map from roles', async () => {
			const roles = [
				createMockRole({ id: 1, code: 'ADMIN' }),
				createMockRole({ id: 2, code: 'MANAGER' }),
			]
			fakeRepo.getList = async () => roles

			const map = await service.getRelationMap()

			expect(map.get(1)?.code).toBe('ADMIN')
			expect(map.get(2)?.code).toBe('MANAGER')
			expect(map.has(3)).toBe(false)
		})
	})

	describe('count', () => {
		it('delegates to repo', async () => {
			fakeRepo.count = async () => 5
			const result = await service.count()
			expect(result).toBe(5)
		})
	})

	describe('seed', () => {
		it('delegates to repo without exposing repo publicly', async () => {
			let called = false
			fakeRepo.seed = async (data) => {
				called = true
				expect(data).toHaveLength(1)
			}

			await service.seed([{
				code: 'TEST',
				name: 'Test',
				description: null,
				permissions: [],
				isSystem: false,
				createdBy: 1,
			}])
			expect(called).toBe(true)
		})
	})

	describe('handleRemove', () => {
		it('returns id on successful remove', async () => {
			fakeRepo.remove = async () => 1
			fakeRepo.getById = async () => createMockRole({ id: 1, isSystem: false })
			const result = await service.handleRemove(1)
			expect(result).toEqual({ id: 1 })
		})

		it('throws ROLE_NOT_FOUND when role does not exist', async () => {
			fakeRepo.getById = async () => undefined
			try {
				await service.handleRemove(999)
				expect(false).toBe(true)
			} catch (error: unknown) {
				expect((error as { code: string }).code).toBe('ROLE_NOT_FOUND')
			}
		})

		it('throws when trying to delete system role', async () => {
			fakeRepo.getById = async () => createMockRole({ id: 1, isSystem: true })
			try {
				await service.handleRemove(1)
				expect(false).toBe(true)
			} catch (error: unknown) {
				expect((error as { code: string }).code).toBe('ROLE_DELETE_SYSTEM_ROLE_FORBIDDEN')
			}
		})
	})

	describe('handleUpdate', () => {
		it('throws ROLE_NOT_FOUND when role does not exist', async () => {
			fakeRepo.getById = async () => undefined
			const data: dto.RoleUpdateDto = { id: 999, code: 'UPDATED', name: 'Updated', description: null, permissions: [], isSystem: false }
			try {
				await service.handleUpdate(data, 1)
				expect(false).toBe(true)
			} catch (error: unknown) {
				expect((error as { code: string }).code).toBe('ROLE_NOT_FOUND')
			}
		})

		it('throws when trying to update system role', async () => {
			fakeRepo.getById = async () => createMockRole({ id: 1, isSystem: true })
			const data: dto.RoleUpdateDto = { id: 1, code: 'UPDATED', name: 'Updated', description: null, permissions: [], isSystem: false }
			try {
				await service.handleUpdate(data, 1)
				expect(false).toBe(true)
			} catch (error: unknown) {
				expect((error as { code: string }).code).toBe('ROLE_UPDATE_SYSTEM_ROLE_FORBIDDEN')
			}
		})
	})
})
