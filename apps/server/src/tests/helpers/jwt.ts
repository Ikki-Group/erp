import jwt from 'jsonwebtoken'

import type { SessionPayloadDto } from '@/modules/auth/session/session.dto'

/**
 * Generates a valid JWT token for testing purposes.
 * Uses the same secret and structure as the production SessionService.
 * Does not create a session in the database - use session manager for that.
 */
export function generateTestToken(payload: SessionPayloadDto): string {
	const secret = Bun.env.JWT_SECRET ?? 'test-secret-min-32-characters-long-enough'
	const expiresIn = '7d' // Default from env

	return jwt.sign(payload, secret, { expiresIn })
}

/**
 * Generates a test token for a mock user.
 */
export function generateTestUserToken(): string {
	return generateTestToken({
		id: 999, // Mock session ID
		userId: 1,
		email: 'test@example.com',
		username: 'testuser',
	})
}
