import jwt from 'jsonwebtoken'

import type { SessionPayloadDto } from '@/modules/auth/session/session.dto'

/**
 * Generates a valid JWT token for testing purposes.
 * Uses the same secret and structure as the production SessionService.
 */
export function generateTestToken(payload: Omit<SessionPayloadDto, 'id'>): string {
	const secret = Bun.env.JWT_SECRET ?? 'test-secret-min-32-characters-long-enough'
	const expiresIn = '7d' // Default from env

	const fullPayload: SessionPayloadDto = {
		id: 999, // Mock session ID
		...payload,
	}

	return jwt.sign(fullPayload, secret, { expiresIn })
}

/**
 * Generates a test token for a mock user.
 */
export function generateTestUserToken(): string {
	return generateTestToken({
		userId: 1,
		email: 'test@example.com',
		username: 'testuser',
	})
}
