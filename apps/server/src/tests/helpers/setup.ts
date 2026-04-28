import { clearTestCache } from './cache'
import { setupTestDatabase, teardownTestDatabase } from './db'
import { beforeAll, afterAll, afterEach } from 'bun:test'

/**
 * Setup for unit tests - no database or cache required.
 */
export function setupUnitTests(): void {
	afterEach(async () => {
		await clearTestCache()
	})
}

/**
 * Setup for integration tests with database.
 * Each test should use withTransaction() for isolation.
 */
export function setupIntegrationTests(): void {
	beforeAll(async () => {
		await setupTestDatabase()
	})

	afterAll(async () => {
		await teardownTestDatabase()
	})

	afterEach(async () => {
		await clearTestCache()
	})
}
