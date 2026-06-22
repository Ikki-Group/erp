/**
 * Mock Database for Unit Testing
 *
 * Provides type-safe Drizzle mocks without requiring database connection.
 * Use for isolated unit tests. For integration tests, use real DB in setup.ts.
 */

import type { DbClient } from '@/infra/database'

export interface MockDbClient extends DbClient {
	_mockData: Map<string, any[]>
	_mockReset: () => void
}

/**
 * Create a mock Drizzle client for unit testing.
 *
 * Usage:
 * ```typescript
 * const mockDb = createMockDb()
 * mockDb._mockData.set('users', [{ id: 1, email: 'test@test.com' }])
 *
 * const repo = new UserRepo(mockDb)
 * const user = await repo.findById(1) // Returns mocked data
 * ```
 */
export function createMockDb(): MockDbClient {
	const mockData = new Map<string, any[]>()

	const mockDb = {
		_mockData: mockData,
		_mockReset: () => mockData.clear(),

		// Mock query builder
		select: (fields?: any) => ({
			from: (table: any) => ({
				where: (condition: any) => ({
					then: (resolve: Function) => resolve([]),
				}),
				then: (resolve: Function) => resolve([]),
			}),
		}),

		// Mock insert
		insert: (table: any) => ({
			values: (values: any) => ({
				returning: () => ({
					then: (resolve: Function) => resolve([{ id: 1, ...values }]),
				}),
				then: (resolve: Function) => resolve([{ id: 1, ...values }]),
			}),
		}),

		// Mock update
		update: (table: any) => ({
			set: (values: any) => ({
				where: (condition: any) => ({
					returning: () => ({
						then: (resolve: Function) => resolve([{ id: 1, ...values }]),
					}),
					then: (resolve: Function) => resolve([{ id: 1, ...values }]),
				}),
			}),
		}),

		// Mock delete
		delete: (table: any) => ({
			where: (condition: any) => ({
				returning: () => ({
					then: (resolve: Function) => resolve([{ id: 1 }]),
				}),
				then: (resolve: Function) => resolve([{ id: 1 }]),
			}),
		}),

		// Mock execute (for raw SQL)
		execute: async (sql: any) => {
			return { rows: [] }
		},
	} as unknown as MockDbClient

	return mockDb
}

/**
 * Create mock BentoCache client for testing.
 * Implements CacheClient interface with namespace support.
 */
export function createMockCacheClient() {
	const namespaces = new Map<string, Map<string, any>>()

	const getNamespaceStore = (ns: string) => {
		if (!namespaces.has(ns)) {
			namespaces.set(ns, new Map())
		}
		return namespaces.get(ns)!
	}

	return {
		namespace: (ns: string) => {
			const store = getNamespaceStore(ns)

			return {
				get: async (key: string) => store.get(key) ?? null,
				set: async (key: string, value: any) => {
					store.set(key, value)
				},
				delete: async (key: string) => {
					store.delete(key)
				},
				deleteMany: async ({ keys }: { keys: string[] }) => {
					keys.forEach((key) => store.delete(key))
					return true
				},
				getOrSet: async ({ key, factory }: { key: string; factory: (ctx: any) => Promise<any> }) => {
					if (store.has(key)) return store.get(key)
					const ctx = { skip: () => undefined }
					const value = await factory(ctx)
					if (value !== undefined) {
						store.set(key, value)
					}
					return value
				},
				clear: async () => {
					store.clear()
				},
				_store: store, // For test inspection
			}
		},
		_namespaces: namespaces, // For test inspection
		_reset: () => namespaces.clear(),
	}
}

/**
 * Create mock repository with common CRUD operations.
 *
 * Usage:
 * ```typescript
 * const mockRepo = createMockRepo<User>()
 * mockRepo.findById.mockResolvedValue({ id: 1, email: 'test@test.com' })
 * ```
 */
export function createMockRepo<T extends { id: number }>() {
	const store = new Map<number, T>()

	return {
		_store: store,
		_reset: () => store.clear(),

		findById: async (id: number): Promise<T | null> => {
			return store.get(id) ?? null
		},

		findByIds: async (ids: number[]): Promise<T[]> => {
			return ids.map((id) => store.get(id)).filter(Boolean) as T[]
		},

		findAll: async (): Promise<T[]> => {
			return Array.from(store.values())
		},

		findPage: async (filter: any): Promise<any> => {
			const data = Array.from(store.values())
			return {
				data,
				meta: {
					total: data.length,
					page: filter.page ?? 1,
					limit: filter.limit ?? 10,
				},
			}
		},

		create: async (data: Omit<T, 'id'>): Promise<T> => {
			const id = store.size + 1
			const record = { id, ...data } as T
			store.set(id, record)
			return record
		},

		insert: async (data: Omit<T, 'id'>): Promise<T> => {
			const id = store.size + 1
			const record = { id, ...data } as T
			store.set(id, record)
			return record
		},

		update: async (id: number, data: Partial<T>): Promise<T | null> => {
			const existing = store.get(id)
			if (!existing) return null
			const updated = { ...existing, ...data }
			store.set(id, updated)
			return updated
		},

		delete: async (id: number): Promise<T | null> => {
			const existing = store.get(id)
			if (!existing) return null
			store.delete(id)
			return existing
		},

		remove: async (id: number): Promise<{ id: number }> => {
			const existing = store.get(id)
			if (!existing) return { id }
			store.delete(id)
			return { id }
		},
	}
}
