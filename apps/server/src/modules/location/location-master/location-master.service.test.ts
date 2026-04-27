import { beforeEach, describe, expect, it } from 'bun:test'

import type { WithPaginationResult } from '@/core/database'

import * as dto from './location-master.dto'
import { LocationMasterRepo } from './location-master.repo'
import { LocationMasterService } from './location-master.service'

function createMockLocation(overrides: Partial<dto.LocationDto> = {}): dto.LocationDto {
	return {
		id: 1,
		code: 'MAIN-01',
		name: 'Main Store',
		type: 'store',
		description: null,
		address: null,
		phone: null,
		isActive: true,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		createdBy: 1,
		updatedBy: 1,
		...overrides,
	}
}

function createFakeRepo(overrides: Partial<LocationMasterRepo> = {}): LocationMasterRepo {
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
	} as LocationMasterRepo
}

describe('LocationMasterService', () => {
	let service: LocationMasterService
	let fakeRepo: LocationMasterRepo

	beforeEach(() => {
		fakeRepo = createFakeRepo()
		service = new LocationMasterService(fakeRepo)
	})

	describe('getById', () => {
		it('delegates to repo and returns result when found', async () => {
			const location = createMockLocation({ id: 1 })
			fakeRepo.getById = async () => location
			const result = await service.getById(1)
			expect(result).toEqual(location)
		})

		it('returns undefined when not found', async () => {
			fakeRepo.getById = async () => undefined
			const result = await service.getById(999)
			expect(result).toBeUndefined()
		})
	})

	describe('handleDetail', () => {
		it('returns result when found', async () => {
			const location = createMockLocation({ id: 1 })
			fakeRepo.getById = async () => location
			const result = await service.handleDetail(1)
			expect(result).toEqual(location)
		})

		it('throws LOCATION_NOT_FOUND when missing', async () => {
			fakeRepo.getById = async () => undefined
			try {
				await service.handleDetail(999)
				expect(false).toBe(true)
			} catch (error: unknown) {
				expect((error as { code: string }).code).toBe('LOCATION_NOT_FOUND')
			}
		})
	})

	describe('handleList', () => {
		it('delegates pagination filter to repo', async () => {
			const mockResult: WithPaginationResult<dto.LocationDto> = {
				data: [createMockLocation()],
				meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
			}
			fakeRepo.getListPaginated = async () => mockResult

			const filter: dto.LocationFilterDto = { q: undefined, type: undefined, page: 1, limit: 10 }
			const result = await service.handleList(filter)

			expect(result.data).toHaveLength(1)
			expect(result.meta.total).toBe(1)
		})
	})

	describe('getList', () => {
		it('delegates to repo', async () => {
			const locations = [createMockLocation({ id: 1 }), createMockLocation({ id: 2 })]
			fakeRepo.getList = async () => locations
			const result = await service.getList()
			expect(result).toHaveLength(2)
		})
	})

	describe('getRelationMap', () => {
		it('creates relation map from locations', async () => {
			const locations = [
				createMockLocation({ id: 1, code: 'STORE-01' }),
				createMockLocation({ id: 2, code: 'WH-01' }),
			]
			fakeRepo.getList = async () => locations

			const map = await service.getRelationMap()

			expect(map.get(1)?.code).toBe('STORE-01')
			expect(map.get(2)?.code).toBe('WH-01')
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
				type: 'store',
				description: null,
				address: null,
				phone: null,
				isActive: true,
				createdBy: 1,
			}])
			expect(called).toBe(true)
		})
	})

	describe('handleRemove', () => {
		it('returns id on successful remove', async () => {
			fakeRepo.remove = async () => 1
			const result = await service.handleRemove(1)
			expect(result).toEqual({ id: 1 })
		})

		it('throws LOCATION_NOT_FOUND when remove fails', async () => {
			fakeRepo.remove = async () => undefined
			fakeRepo.getById = async () => ({ id: 999, code: 'TEST', name: 'Test', type: 'store', description: null, address: null, phone: null, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: 1, updatedBy: 1 })
			try {
				await service.handleRemove(999)
				expect(false).toBe(true)
			} catch (error: unknown) {
				expect((error as { code: string }).code).toBe('LOCATION_NOT_FOUND')
			}
		})
	})
})
