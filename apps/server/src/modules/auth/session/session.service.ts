import { record } from '@elysiajs/opentelemetry'
import jwt from 'jsonwebtoken'

import { logger } from '@/core/logger'

import { CacheService, type CacheClient } from '@/lib/cache'

import type { UserDto } from '@/modules/iam'

import { SessionPayloadDto, type SessionDto } from './session.dto'
import { SessionRepo } from './session.repo'
import { env } from '@/config/env'

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
	async getById(id: number): Promise<SessionDto | undefined> {
		return record('SessionService.getById', async () => {
			return this.cache.getOrSetSkipUndefined({
				key: `byId:${id}`,
				factory: () => this.repo.getById(id),
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

			const session = await this.repo.create({
				userId: user.id,
				createdAt,
				expiredAt,
			})

			const data: SessionPayloadDto = {
				id: session.id,
				userId: user.id,
				email: user.email,
				username: user.username,
			}

			const token = jwt.sign(data, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })

			return { session, token }
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

				// If session expired, invalidate it and return null
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
			await this.repo.invalidate(id)
			await this.cache.deleteMany({ keys: [`byId:${id}`] })
		})
	}

	/**
	 * Cleanup expired sessions from the database.
	 */
	async cleanupExpired(): Promise<void> {
		return record('SessionService.cleanupExpired', async () => {
			await this.repo.cleanupExpired()
		})
	}
}
