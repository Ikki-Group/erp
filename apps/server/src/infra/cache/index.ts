import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'

// ─── BentoCache Instance (memory driver) ───

export const cache = new BentoCache({
	default: 'memory',
	stores: {
		memory: bentostore().useL1Layer(memoryDriver({ maxSize: 1000 })),
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
			return this.client.getOrSet({ key, factory, ttl }) as Promise<T>
		}
		return this.client.getOrSet({ key, factory }) as Promise<T>
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
