import type { CachePort } from '@/shared/cache/cache.port.ts'

import type { CacheClient } from './client.ts'

const fullKey = (namespace: string, value: string) => `${namespace}:${value}`

/** CachePort adapter over a BentoCache instance (native tags, L1/L2 + bus). */
export function createCachePort(bento: CacheClient): CachePort {
	return {
		getOrSet(namespace, key, factory, ttlSeconds, tags) {
			return bento.getOrSet({
				key: fullKey(namespace, key),
				factory: (ctx) => factory({ setTags: (next) => ctx.setTags(next) }),
				...(ttlSeconds ? { ttl: `${ttlSeconds}s` } : {}),
				...(tags?.length ? { tags } : {}),
			})
		},
		async getOrSetOptional(namespace, key, factory) {
			const k = fullKey(namespace, key)
			const existing = await bento.get<Awaited<ReturnType<typeof factory>>>({ key: k })
			if (existing !== undefined && existing !== null) return existing
			const fresh = await factory()
			if (fresh !== undefined) await bento.set({ key: k, value: fresh })
			return fresh
		},
		async invalidate(namespace, id) {
			const keys = [fullKey(namespace, 'list'), fullKey(namespace, 'count')]
			if (id !== undefined) keys.push(fullKey(namespace, `byId:${id}`))
			await bento.deleteMany({ keys })
		},
		async invalidateKeys(keys) {
			if (keys.length > 0) await bento.deleteMany({ keys })
		},
		async invalidateTag(tag) {
			await bento.deleteByTag({ tags: [tag] })
		},
	}
}
