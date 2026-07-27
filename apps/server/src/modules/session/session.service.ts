import jwt from 'jsonwebtoken'

import { env } from '@/config/env'
import { CacheService, type CacheClient } from '@/infra/cache'
import { logger } from '@/infra/logger'

import type { UserDto } from '@/modules/iam'

import { SessionDto, SessionPayloadDto } from './session.contract'
import type { ISessionRepo } from './session.repo'

export class SessionService {
	private readonly cache: CacheService

	constructor(
		private readonly repo: ISessionRepo,
		cacheClient: CacheClient,
	) {
		this.cache = CacheService.createWithDefaultKeys(cacheClient, 'session')
	}

	/**
	 * Finds a single session by its ID. Cached.
	 */
	async getById(id: number): Promise<SessionDto | undefined> {
		return this.cache.getOrSetWithSkip({
			key: this.cache.keys.byId(id),
			factory: () => this.repo.getById(id),
		})
	}

	/**
	 * Creates a new session and returns the signed JWT token.
	 */
	async createSession(user: UserDto): Promise<{ session: SessionDto; token: string }> {
		const createdAt = new Date()
		const expiredAt = new Date(createdAt.getTime() + env.JWT_EXPIRES_IN * 1000)

		const session = await this.repo.create({
			userId: user.id,
			locationId: user.defaultLocationId || 1,
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
	}

	/**
	 * Verifies a session's token and integrity.
	 */
	async verifySession(token: string): Promise<SessionDto | null> {
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
			logger.error('Failed to verify session', { error })
			return null
		}
	}

	/**
	 * Explicitly deletes a session. Invalidates cache.
	 */
	async deleteSession(id: number): Promise<void> {
		await this.repo.invalidate(id)
		await this.cache.deleteFromKeys([this.cache.keys.byId(id)])
	}

	/**
	 * Cleanup expired sessions from the database.
	 */
	async cleanupExpired(): Promise<void> {
		await this.repo.cleanupExpired()
	}
}
