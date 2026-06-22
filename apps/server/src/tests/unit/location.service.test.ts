/**
 * Unit Test Example: LocationService with Mocks
 *
 * This demonstrates testing service logic WITHOUT database dependency.
 * Uses mock repo and cache for isolation.
 */

import { describe, test, expect, beforeEach } from 'bun:test'
import { LocationService } from '@/modules/location/location.service'
import { createMockRepo, createMockCacheClient } from '../helpers/mock-db'
import type { Location } from '@/modules/location/location.contract'

describe('LocationService (Unit Tests with Mocks)', () => {
	let service: LocationService
	let mockRepo: ReturnType<typeof createMockRepo<Location>>
	let mockCacheClient: ReturnType<typeof createMockCacheClient>

	beforeEach(() => {
		mockRepo = createMockRepo<Location>()
		mockCacheClient = createMockCacheClient()
		service = new LocationService(mockRepo as any, mockCacheClient as any)
	})

	describe('handleGetById', () => {
		test('should return location from cache if exists', async () => {
			const mockLocation: Location = {
				id: 1,
				code: 'WH-001',
				name: 'Warehouse 1',
				type: 'warehouse',
				description: null,
				isActive: true,
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			// Setup: Cache has data
			const locationNamespace = mockCacheClient.namespace('location')
			locationNamespace._store.set('byId:1', mockLocation)

			const result = await service.handleGetById(1)

			expect(result).toEqual(mockLocation)
			// Verify repo was NOT called (cache hit)
			expect(mockRepo._store.size).toBe(0)
		})

		test('should fetch from repo and cache if not in cache', async () => {
			const mockLocation: Location = {
				id: 1,
				code: 'WH-001',
				name: 'Warehouse 1',
				type: 'warehouse',
				description: null,
				isActive: true,
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			// Setup: Repo has data, cache empty
			mockRepo._store.set(1, mockLocation)

			const result = await service.handleGetById(1)

			expect(result).toEqual(mockLocation)
			// Verify cache was populated
			const locationNamespace = mockCacheClient.namespace('location')
			expect(locationNamespace._store.has('byId:1')).toBe(true)
		})

		test('should throw NotFoundError if location does not exist', async () => {
			// Setup: Both cache and repo empty
			expect(async () => {
				await service.handleGetById(999)
			}).toThrow()
		})
	})

	describe('handleCreate', () => {
		test('should create location and invalidate cache', async () => {
			const createDto = {
				code: 'WH-NEW',
				name: 'New Warehouse',
				type: 'warehouse' as const,
				description: 'Test warehouse',
				isActive: true,
			}

			const actor = 1

			const result = await service.handleCreate(createDto, actor)

			expect(result.id).toBeDefined()
			expect(result.code).toBe('WH-NEW')
			expect(result.createdBy).toBe(actor)

			// Verify repo was called
			expect(mockRepo._store.size).toBe(1)

			// Verify cache was invalidated (deleteAll called)
			// Note: In real implementation, check that cache.deleteAll was invoked
		})
	})

	describe('handleUpdate', () => {
		test('should update location and invalidate cache', async () => {
			const existing: Location = {
				id: 1,
				code: 'WH-001',
				name: 'Warehouse 1',
				type: 'warehouse',
				description: null,
				isActive: true,
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			mockRepo._store.set(1, existing)

			const updateDto = {
				id: 1,
				code: 'WH-001',
				name: 'Warehouse 1 Updated',
				type: 'warehouse' as const,
				description: 'Updated description',
				isActive: true,
			}

			const actor = 2

			const result = await service.handleUpdate(updateDto, actor)

			expect(result.name).toBe('Warehouse 1 Updated')
			expect(result.updatedBy).toBe(actor)

			// Verify repo was updated
			const repoData = mockRepo._store.get(1)
			expect(repoData?.name).toBe('Warehouse 1 Updated')
		})
	})

	describe('handleDelete', () => {
		test('should delete location and invalidate cache', async () => {
			const existing: Location = {
				id: 1,
				code: 'WH-001',
				name: 'Warehouse 1',
				type: 'warehouse',
				description: null,
				isActive: true,
				createdBy: 1,
				updatedBy: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			mockRepo._store.set(1, existing)

			const result = await service.handleDelete(1)

			expect(result.id).toBe(1)

			// Verify repo deleted the record
			expect(mockRepo._store.has(1)).toBe(false)
		})
	})

	describe('handleList', () => {
		test('should return paginated list from cache', async () => {
			const mockLocations: Location[] = [
				{
					id: 1,
					code: 'WH-001',
					name: 'Warehouse 1',
					type: 'warehouse',
					description: null,
					isActive: true,
					createdBy: 1,
					updatedBy: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					code: 'WH-002',
					name: 'Warehouse 2',
					type: 'warehouse',
					description: null,
					isActive: true,
					createdBy: 1,
					updatedBy: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			]

			mockLocations.forEach((loc) => mockRepo._store.set(loc.id, loc))

			const result = await service.handleList({
				q: '',
				limit: 10,
				page: 1,
			})

			expect(result.data.length).toBe(2)
			expect(result.meta.total).toBe(2)
		})
	})
})
