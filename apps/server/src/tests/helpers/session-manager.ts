import { generateTestToken } from './jwt'

/**
 * Test session manager for managing authenticated test sessions.
 * Uses mock JWT tokens without requiring database sessions.
 * Simpler approach for happy path tests without database dependencies.
 */
export class TestSessionManager {
	private static instance: TestSessionManager
	private token: string | null = null
	private userId: number | null = null

	private constructor() {}

	static getInstance(): TestSessionManager {
		if (!TestSessionManager.instance) {
			TestSessionManager.instance = new TestSessionManager()
		}
		return TestSessionManager.instance
	}

	/**
	 * Sets up a test session with a mock JWT token.
	 * Call this in a beforeAll hook.
	 */
	setup(): void {
		if (this.token) return // Already setup

		this.userId = 1 // Mock user ID
		this.token = generateTestToken({
			userId: this.userId,
			email: 'test@example.com',
			username: 'testuser',
		})
	}

	/**
	 * Gets the test token. Throws if not yet setup.
	 */
	getToken(): string {
		if (!this.token) {
			throw new Error(
				'Test session not setup. Call TestSessionManager.getInstance().setup() in a beforeAll hook.',
			)
		}
		return this.token
	}

	/**
	 * Gets the test user ID. Throws if not yet setup.
	 */
	getUserId(): number {
		if (!this.userId) {
			throw new Error(
				'Test session not setup. Call TestSessionManager.getInstance().setup() in a beforeAll hook.',
			)
		}
		return this.userId
	}

	/**
	 * Resets the session manager (for cleanup between test suites).
	 */
	reset(): void {
		this.token = null
		this.userId = null
	}
}

/**
 * Helper function to get the test session manager instance.
 */
export function getTestSessionManager(): TestSessionManager {
	return TestSessionManager.getInstance()
}

/**
 * Helper function to get the test token.
 */
export function getTestToken(): string {
	return getTestSessionManager().getToken()
}

/**
 * Helper function to get the test user ID.
 */
export function getTestUserId(): number {
	return getTestSessionManager().getUserId()
}
