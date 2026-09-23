import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { redisDriver } from 'bentocache/drivers/redis'

import { redisConnection } from '@/infra/redis/index.ts'

// ─── BentoCache Instance (memory L1, optional Redis L2) ───

const store = bentostore().useL1Layer(memoryDriver({ maxSize: 1000 }))

export const cache = new BentoCache({
	default: 'primary',
	stores: {
		// L2 (Redis) layer is added only when REDIS_URL is configured; otherwise
		// the cache stays L1-memory-only (e.g. local dev/tests).
		primary: redisConnection
			? store.useL2Layer(redisDriver({ connection: redisConnection }))
			: store,
	},
})

export type CacheClient = typeof cache

// ─── Cache Service (per-module wrapper) ───

export interface CacheKeys {
	list: string
	count: string
	byId: (id: number) => string
}

export class CacheService {
	readonly keys: CacheKeys

	private constructor(
		private readonly client: CacheClient,
		readonly namespace: string,
	) {
		this.keys = {
			list: `${namespace}:list`,
			count: `${namespace}:count`,
			byId: (id: number) => `${namespace}:byId:${id}`,
		}
	}

	static createWithDefaultKeys(client: CacheClient, namespace: string): CacheService {
		return new CacheService(client, namespace)
	}

	async getOrSet<T>({
		key,
		factory,
		ttl,
	}: {
		key: string
		factory: () => Promise<T>
		ttl?: number
	}): Promise<T> {
		if (ttl) {
			return this.client.getOrSet({ key, factory, ttl })
		}
		return this.client.getOrSet({ key, factory })
	}

	async getOrSetWithSkip<T>({
		key,
		factory,
	}: {
		key: string
		factory: () => Promise<T | undefined>
	}): Promise<T | undefined> {
		const value = await this.client.get<T>({ key })
		if (value !== undefined && value !== null) return value
		const fresh = await factory()
		if (fresh !== undefined) {
			await this.client.set({ key, value: fresh })
		}
		return fresh
	}

	async invalidateStandard(id?: number): Promise<void> {
		await this.client.delete({ key: this.keys.list })
		await this.client.delete({ key: this.keys.count })
		if (id !== undefined) {
			await this.client.delete({ key: this.keys.byId(id) })
		}
	}

	async deleteFromKeys(keys: string[]): Promise<void> {
		await Promise.all(keys.map((key) => this.client.delete({ key })))
	}
}
