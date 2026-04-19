import { record } from '@elysiajs/opentelemetry'
import { eq, lte } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import { bento } from '@/core/cache'
import { takeFirst } from '@/core/database'
import { InternalServerError } from '@/core/http/errors'
import { logger } from '@/core/logger'

import { db } from '@/db'
import { sessionsTable } from '@/db/schema'

import type { UserDto } from '@/modules/iam/dto'

import { SessionPayloadDto, type SessionDto } from '../dto'
import { env } from '@/config/env'

const cache = bento.namespace('session')

const err = {
	createFailed: () =>
		new InternalServerError('Failed to create session', 'AUTH_SESSION_CREATE_FAILED'),
}

export class SessionService {
	/**
	 * Finds a single session by its ID. Cached.
	 */
	async getById(id: number): Promise<SessionDto | null> {
		return record('SessionService.getById', async () => {
			return cache.getOrSet({
				key: `${id}`,
				factory: async () => {
					const result = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id))
					return takeFirst(result)
				},
			})
		})
	}

	/**
	 * Creates a new session and returns the signed JWT token.
	 */
	async createSession(user: UserDto): Promise<{ session: SessionDto; token: string }> {
		return record('SessionService.createSession', async () => {
			const createdAt = new Date()
			const expiredAt = new Date(createdAt.getTime() + env.JWT_EXPIRES_IN)

			const [session] = await db
				.insert(sessionsTable)
				.values({ userId: user.id, createdAt, expiredAt })
				.returning()

			if (!session) throw err.createFailed()

			const data: SessionPayloadDto = {
				id: session.id,
				userId: user.id,
				email: user.email,
				username: user.username,
			}

			const token = jwt.sign(data, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })

			return { session: session as SessionDto, token }
		})
	}

	/**
	 * Verifies a session's token and integrity.
	 */
	async verifySession(token: string): Promise<SessionDto | null> {
		return record('SessionService.verifySession', async () => {
			try {
				const decoded = jwt.verify(token, env.JWT_SECRET)
				const valid = SessionPayloadDto.parse(decoded)
				const session = await this.getById(valid.id)

				if (!session) return null

				// If session expired, delete it and return null
				if (session.expiredAt < new Date()) {
					await this.deleteSession(session.id)
					return null
				}

				return session
			} catch (error) {
				logger.error(error, 'Failed to verify session')
				return null
			}
		})
	}

	/**
	 * Explicitly deletes a session. Invalidates cache.
	 */
	async deleteSession(id: number): Promise<void> {
		return record('SessionService.deleteSession', async () => {
			await db.delete(sessionsTable).where(eq(sessionsTable.id, id))
			await cache.deleteMany({ keys: [`${id}`] })
		})
	}

	/**
	 * Cleanup expired sessions from the database.
	 */
	async cleanupExpired(): Promise<void> {
		return record('SessionService.cleanupExpired', async () => {
			await db.delete(sessionsTable).where(lte(sessionsTable.expiredAt, new Date()))
		})
	}
}
