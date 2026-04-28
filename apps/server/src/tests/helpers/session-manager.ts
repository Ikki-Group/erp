import { getTestDatabase } from './db'
import { generateTestToken } from './jwt'

/**
 * Test session manager for managing authenticated test sessions.
 * Creates a test user and session once, then provides the token for all tests.
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
	 * Sets up a test session with a user and session in the database.
	 * Call this in a beforeAll hook.
	 */
	async setup(): Promise<void> {
		if (this.token) return // Already setup

		const db = getTestDatabase()
		const { usersTable } = await import('@/db/schema/iam')

		// Create a test user
		const userResult = await db
			.insert(usersTable)
			.values({
				email: 'test@example.com',
				username: 'testuser',
				passwordHash: 'hashed-password-placeholder',
				fullname: 'Test User',
				isActive: true,
				createdBy: 1,
				updatedBy: 1,
			})
			.returning({ id: usersTable.id })

		if (!userResult[0]) throw new Error('Failed to create test user')
		this.userId = userResult[0].id

		// Generate a JWT token for this user
		this.token = await generateTestToken({
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
