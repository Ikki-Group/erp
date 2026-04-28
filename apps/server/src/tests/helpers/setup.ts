import { beforeAll, afterAll, afterEach } from 'bun:test'
import { setupTestDatabase, resetTestDatabase, teardownTestDatabase } from './db'
import { clearTestCache } from './cache'

/**
 * Sets up integration test lifecycle hooks.
 * Call this at the top of your integration test file.
 * 
 * Example:
 * ```typescript
 * import { setupIntegrationTests } from '@/tests/helpers/setup'
 * setupIntegrationTests()
 * 
 * describe('Material HTTP Endpoints', () => {
 *   // your tests here
 * })
 * ```
 */
export function setupIntegrationTests(): void {
	beforeAll(async () => {
		await setupTestDatabase()
	})

	afterEach(async () => {
		await resetTestDatabase()
		await clearTestCache()
	})

	afterAll(async () => {
		await teardownTestDatabase()
	})
}

/**
 * Sets up lightweight test lifecycle for unit tests that don't need DB.
 * Just clears cache between tests.
 */
export function setupUnitTests(): void {
	afterEach(async () => {
		await clearTestCache()
	})
}
