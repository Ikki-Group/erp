import jwt from 'jsonwebtoken'

import { CacheService, type CacheClient } from '@/core/cache'
import { logger } from '@/core/logger'

import { env } from '@/config/env'

import type { UserSchema } from '@/modules/iam'

import { SessionRepo } from './session.repo'
import type { SessionSchema } from './session.schema'
import { SessionPayloadSchema } from './session.schema'

export class SessionService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: SessionRepo,
		cacheClient: CacheClient,
	) {
		this.cache = new CacheService({ ns: 'session', client: cacheClient })
	}

	/**
	 * Finds a single session by its ID. Cached.
	 */
	async getById(id: number): Promise<SessionSchema | undefined> {
		return this.cache.getOrSetSkipUndefined({
			key: `byId:${id}`,
			factory: () => this.repo.getById(id),
		})
	}

	/**
	 * Creates a new session and returns the signed JWT token.
	 */
	async createSession(user: UserSchema): Promise<{ session: SessionSchema; token: string }> {
		const createdAt = new Date()
		const expiredAt = new Date(createdAt.getTime() + env.JWT_EXPIRES_IN)

		const session = await this.repo.create({
			userId: user.id,
			createdAt,
			expiredAt,
		})

		const data: SessionPayloadSchema = {
			id: session.id,
			userId: user.id,
			email: user.email,
			username: user.username,
		}

		const token = jwt.sign(data, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })

		return { session, token }
	}

	/**
	 * Verifies a session's token and integrity.
	 */
	async verifySession(token: string): Promise<SessionSchema | null> {
		try {
			const decoded = jwt.verify(token, env.JWT_SECRET)
			const valid = SessionPayloadSchema.parse(decoded)
			const session = await this.getById(valid.id)

			if (!session) return null

			// If session expired, invalidate it and return null
			if (session.expiredAt < new Date()) {
				await this.deleteSession(session.id)
				return null
			}

			return session
		} catch (error) {
			logger.error('Failed to verify session', { error })
			return null
		}
	}

	/**
	 * Explicitly deletes a session. Invalidates cache.
	 */
	async deleteSession(id: number): Promise<void> {
		await this.repo.invalidate(id)
		await this.cache.deleteMany({ keys: [`byId:${id}`] })
	}

	/**
	 * Cleanup expired sessions from the database.
	 */
	async cleanupExpired(): Promise<void> {
		await this.repo.cleanupExpired()
	}
}
