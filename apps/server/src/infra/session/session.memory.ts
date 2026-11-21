import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'

import type { CreateSessionInput, SessionData, SessionStore } from '@/shared/auth/session.port.ts'

export interface MemorySessionStoreOptions {
	ttlSeconds: number
	maxSize?: number
}

function createBento(maxSize: number) {
	return new BentoCache({
		default: 'memory',
		stores: {
			memory: bentostore().useL1Layer(memoryDriver({ maxSize })),
		},
	})
}

export class MemorySessionStore implements SessionStore {
	private readonly bento: ReturnType<typeof createBento>
	private readonly sessionIdsByUser = new Map<number, Set<string>>()
	private readonly ttlSeconds: number

	constructor(options: MemorySessionStoreOptions = { ttlSeconds: 7 * 24 * 60 * 60 }) {
		this.ttlSeconds = options.ttlSeconds
		this.bento = createBento(options.maxSize ?? 1000)
	}

	async get(sessionId: string): Promise<SessionData | undefined> {
		const stored = await this.bento.get<SessionData>({ key: this.#key(sessionId) })
		if (!stored) return undefined

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
		await this.bento.set({
			key: this.#key(data.id),
			value: data,
			ttl: `${this.ttlSeconds}s`,
		})
		const ids = this.sessionIdsByUser.get(data.userId) ?? new Set<string>()
		ids.add(data.id)
		this.sessionIdsByUser.set(data.userId, ids)
	}

	async delete(sessionId: string): Promise<void> {
		await this.bento.delete({ key: this.#key(sessionId) })
		for (const [userId, ids] of this.sessionIdsByUser) {
			ids.delete(sessionId)
			if (ids.size === 0) this.sessionIdsByUser.delete(userId)
		}
	}

	async deleteAllForUser(userId: number): Promise<void> {
		const ids = this.sessionIdsByUser.get(userId)
		if (!ids) return
		await Promise.all([...ids].map((id) => this.bento.delete({ key: this.#key(id) })))
		this.sessionIdsByUser.delete(userId)
	}

	#key(sessionId: string): string {
		return `auth:session:${sessionId}`
	}
}
