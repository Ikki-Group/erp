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

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Mock client intentionally narrows to test-only interface
	const mockDb = {
		_mockData: mockData,
		_mockReset: () => mockData.clear(),

		// Mock query builder
		select: (_fields?: any) => ({
			from: (_table: any) => ({
				where: (_condition: any) => ({
					then: (resolve: Function) => resolve([]),
				}),
				then: (resolve: Function) => resolve([]),
			}),
		}),

		// Mock insert
		insert: (_table: any) => ({
			values: (values: any) => ({
				returning: () => ({
					then: (resolve: Function) => resolve([{ id: 1, ...values }]),
				}),
				then: (resolve: Function) => resolve([{ id: 1, ...values }]),
			}),
		}),

		// Mock update
		update: (_table: any) => ({
			set: (values: any) => ({
				where: (_condition: any) => ({
					returning: () => ({
						then: (resolve: Function) => resolve([{ id: 1, ...values }]),
					}),
					then: (resolve: Function) => resolve([{ id: 1, ...values }]),
				}),
			}),
		}),

		// Mock delete
		delete: (_table: any) => ({
			where: (_condition: any) => ({
				returning: () => ({
					then: (resolve: Function) => resolve([{ id: 1 }]),
				}),
				then: (resolve: Function) => resolve([{ id: 1 }]),
			}),
		}),

		// Mock execute (for raw SQL)
		execute: async (_sql: any) => {
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
				getOrSet: async ({
					key,
					factory,
				}: {
					key: string
					factory: (ctx: any) => Promise<any>
				}) => {
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
