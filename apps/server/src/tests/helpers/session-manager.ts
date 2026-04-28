import { createUser, createSession } from './factories/iam'
import { generateTestToken } from './jwt'

/**
 * Test session manager for managing authenticated test sessions.
 * Creates a test user and session in the database, then provides the token for all tests.
 */
export class TestSessionManager {
	private static instance: TestSessionManager
	private token: string | null = null
	private userId: number | null = null
	private sessionId: number | null = null

	private constructor() {}

	static getInstance(): TestSessionManager {
		if (!TestSessionManager.instance) {
			TestSessionManager.instance = new TestSessionManager()
		}
		return TestSessionManager.instance
	}

	/**
	 * Sets up a test session with a user and session in the database.
	 * Call this in a beforeAll hook.
	 */
	async setup(): Promise<void> {
		if (this.token) return // Already setup

		// Use unique email to avoid conflicts
		const uniqueEmail = `test-auth-${Date.now()}@example.com`

		// Create a test user
		const user = await createUser({
			email: uniqueEmail,
			username: `testauthuser-${Date.now()}`,
		})
		this.userId = user.id

		// Create a session for this user
		const session = await createSession(this.userId)
		this.sessionId = session.id

		// Generate a JWT token for this session with the correct session ID
		this.token = generateTestToken({
			id: this.sessionId, // Use the actual session ID from database
			userId: this.userId,
			email: user.email,
			username: user.username,
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
	 * Gets the test session ID. Throws if not yet setup.
	 */
	getSessionId(): number {
		if (!this.sessionId) {
			throw new Error(
				'Test session not setup. Call TestSessionManager.getInstance().setup() in a beforeAll hook.',
			)
		}
		return this.sessionId
	}

	/**
	 * Resets the session manager (for cleanup between test suites).
	 */
	reset(): void {
		this.token = null
		this.userId = null
		this.sessionId = null
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
