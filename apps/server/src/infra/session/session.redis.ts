import type { CreateSessionInput, SessionData, SessionStore } from '@/shared/auth/session.port.ts'

import type Redis from 'ioredis'

function isSessionData(value: unknown): value is SessionData {
	if (typeof value !== 'object' || value === null) return false
	if (!('id' in value) || !('userId' in value) || !('expiresAt' in value)) return false
	return typeof value.id === 'string' && typeof value.userId === 'number'
}

function parseSessionData(raw: string): SessionData {
	const value: unknown = JSON.parse(raw)
	if (!isSessionData(value)) throw new Error('Invalid session payload stored in Redis')
	return value
}

export interface RedisSessionStoreOptions {
	client: Redis
	ttlSeconds: number
}

/**
 * Redis-backed adapter for the SessionStore port (ADR-0007 §1). Sessions are
 * stored as JSON under `auth:session:{id}` with a Redis TTL; a per-user Redis
 * set (`auth:session:user:{userId}`) tracks the session ids so that
 * `deleteAllForUser` doesn't require a scan.
 */
export class RedisSessionStore implements SessionStore {
	private readonly client: Redis
	private readonly ttlSeconds: number

	constructor(options: RedisSessionStoreOptions) {
		this.client = options.client
		this.ttlSeconds = options.ttlSeconds
	}

	async get(sessionId: string): Promise<SessionData | undefined> {
		const raw = await this.client.get(this.#key(sessionId))
		if (!raw) return undefined

		const stored = parseSessionData(raw)
		const session = {
			...stored,
			expiresAt: new Date(stored.expiresAt),
		}
		if (session.expiresAt <= new Date()) {
			await this.delete(sessionId)
			return undefined
		}
		return session
	}

	async create(data: CreateSessionInput): Promise<void> {
		const userKey = this.#userKey(data.userId)
		await this.client
			.multi()
			.set(this.#key(data.id), JSON.stringify(data), 'EX', this.ttlSeconds)
			.sadd(userKey, data.id)
			.expire(userKey, this.ttlSeconds)
			.exec()
	}

	async delete(sessionId: string): Promise<void> {
		const raw = await this.client.get(this.#key(sessionId))
		await this.client.del(this.#key(sessionId))
		if (!raw) return

		const { userId } = parseSessionData(raw)
		await this.client.srem(this.#userKey(userId), sessionId)
	}

	async deleteAllForUser(userId: number): Promise<void> {
		const userKey = this.#userKey(userId)
		const ids = await this.client.smembers(userKey)
		if (ids.length > 0) {
			await this.client.del(...ids.map((id) => this.#key(id)))
		}
		await this.client.del(userKey)
	}

	#key(sessionId: string): string {
		return `auth:session:${sessionId}`
	}

	#userKey(userId: number): string {
		return `auth:session:user:${userId}`
	}
}
