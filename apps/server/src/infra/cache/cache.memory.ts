import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { redisDriver } from 'bentocache/drivers/redis'

import { redisConnection } from '@/infra/redis/index.ts'
import type { CachePort } from '@/shared/cache/cache.port.ts'

const store = bentostore().useL1Layer(memoryDriver({ maxSize: 1000 }))

const bento = new BentoCache({
	default: 'primary',
	stores: {
		// L2 (Redis) layer is added only when REDIS_URL is configured; otherwise
		// the cache stays L1-memory-only (e.g. local dev/tests).
		primary: redisConnection
			? store.useL2Layer(redisDriver({ connection: redisConnection }))
			: store,
	},
})

const tagKeys = new Map<string, Set<string>>()

const key = (namespace: string, value: string) => `${namespace}:${value}`

export const cache: CachePort = {
	async getOrSet(namespace, value, factory, ttlSeconds, tags) {
		const fullKey = key(namespace, value)
		for (const tag of tags ?? []) {
			const keys = tagKeys.get(tag) ?? new Set<string>()
			keys.add(fullKey)
			tagKeys.set(tag, keys)
		}
		return ttlSeconds
			? bento.getOrSet({ key: fullKey, factory, ttl: `${ttlSeconds}s` })
			: bento.getOrSet({ key: fullKey, factory })
	},
	async getOrSetOptional(namespace, value, factory) {
		const existing = await bento.get<Awaited<ReturnType<typeof factory>>>({
			key: key(namespace, value),
		})
		if (existing !== undefined && existing !== null) return existing

		const fresh = await factory()
		if (fresh !== undefined) await bento.set({ key: key(namespace, value), value: fresh })
		return fresh
	},
	async invalidate(namespace, id) {
		await bento.delete({ key: key(namespace, 'list') })
		await bento.delete({ key: key(namespace, 'count') })
		if (id !== undefined) await bento.delete({ key: key(namespace, `byId:${id}`) })
	},
	async tagKeys(keys, tags) {
		for (const tag of tags) {
			const existing = tagKeys.get(tag) ?? new Set<string>()
			for (const cacheKey of keys) existing.add(cacheKey)
			tagKeys.set(tag, existing)
		}
		return Promise.resolve()
	},
	async invalidateKeys(keys) {
		await Promise.all(keys.map((fullyQualifiedKey) => bento.delete({ key: fullyQualifiedKey })))
	},
	async invalidateTag(tag) {
		const keys = tagKeys.get(tag)
		if (!keys) return
		tagKeys.delete(tag)
		await Promise.all(
			[...keys].map((fullyQualifiedKey) => bento.delete({ key: fullyQualifiedKey })),
		)
	},
}
