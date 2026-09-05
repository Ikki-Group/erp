import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'

import type { CachePort } from '@/shared/cache/cache.port.ts'

const bento = new BentoCache({
	default: 'memory',
	stores: {
		memory: bentostore().useL1Layer(memoryDriver({ maxSize: 1000 })),
	},
})

const key = (namespace: string, value: string) => `${namespace}:${value}`

export const cache: CachePort = {
	async getOrSet(namespace, value, factory, ttlSeconds) {
		return ttlSeconds
			? bento.getOrSet({ key: key(namespace, value), factory, ttl: `${ttlSeconds}s` })
			: bento.getOrSet({ key: key(namespace, value), factory })
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
	async invalidateKeys(keys) {
		await Promise.all(keys.map((fullyQualifiedKey) => bento.delete({ key: fullyQualifiedKey })))
	},
}
