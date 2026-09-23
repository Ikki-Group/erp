import type { CreateSessionInput, SessionData, SessionStore } from '@/shared/auth/session.port.ts'

import type { RedisClient } from 'bun'

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

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

async function readMembers(client: RedisClient, key: string): Promise<string[]> {
	const result: unknown = await client.send('SMEMBERS', [key])
	return isStringArray(result) ? result : []
}

export interface RedisSessionStoreOptions {
	client: RedisClient
	ttlSeconds: number
}

/**
 * Redis-backed adapter for the SessionStore port (ADR-0007 §1). Sessions are
 * stored as JSON under `auth:session:{id}` with a Redis TTL; a per-user Redis
 * set (`auth:session:user:{userId}`) tracks the session ids so that
 * `deleteAllForUser` doesn't require a scan.
 */
export class RedisSessionStore implements SessionStore {
	private readonly client: RedisClient
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
		await this.client.set(this.#key(data.id), JSON.stringify(data), 'EX', this.ttlSeconds)
		await this.client.send('SADD', [this.#userKey(data.userId), data.id])
		await this.client.expire(this.#userKey(data.userId), this.ttlSeconds)
	}

	async delete(sessionId: string): Promise<void> {
		const raw = await this.client.get(this.#key(sessionId))
		await this.client.del(this.#key(sessionId))
		if (!raw) return

		const { userId } = parseSessionData(raw)
		await this.client.send('SREM', [this.#userKey(userId), sessionId])
	}

	async deleteAllForUser(userId: number): Promise<void> {
		const userKey = this.#userKey(userId)
		const ids = await readMembers(this.client, userKey)
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
