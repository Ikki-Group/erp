import jwt from 'jsonwebtoken'

import type { SessionPayloadDto } from '@/modules/auth/session/session.dto'

import { getTestDatabase } from './db'

/**
 * Generates a valid JWT token for testing purposes.
 * Creates a session in the database and returns the signed token.
 * Uses the same secret and structure as the production SessionService.
 */
export async function generateTestToken(payload: Omit<SessionPayloadDto, 'id'>): Promise<string> {
	const secret = Bun.env.JWT_SECRET ?? 'test-secret-min-32-characters-long-enough'
	const expiresIn = '7d' // Default from env

	// Create a session in the database
	const db = getTestDatabase()
	const { sessionsTable } = await import('@/db/schema/iam')

	const sessionResult = await db
		.insert(sessionsTable)
		.values({
			userId: payload.userId,
			expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
		})
		.returning({ id: sessionsTable.id })

	if (!sessionResult[0]) throw new Error('Failed to create session')

	const fullPayload: SessionPayloadDto = {
		id: sessionResult[0].id,
		...payload,
	}

	return jwt.sign(fullPayload, secret, { expiresIn })
}

/**
 * Generates a test token for a mock user with session in database.
 */
export async function generateTestUserToken(): Promise<string> {
	return generateTestToken({
		userId: 1,
		email: 'test@example.com',
		username: 'testuser',
	})
}
