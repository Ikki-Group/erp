import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { redisBusDriver, redisDriver } from 'bentocache/drivers/redis'

import type Redis from 'ioredis'

export interface CreateCacheOptions {
	/** When provided: L1 memory + L2 Redis + Redis bus (cross-instance L1 invalidation). */
	redis?: Redis | undefined
	/** Max L1 entries. */
	maxSize?: number
}

/**
 * Build a BentoCache instance. Exported as a factory so tests can simulate
 * several machines sharing one Redis; the app uses the singleton in index.ts.
 */
export function createCache({ redis, maxSize = 1000 }: CreateCacheOptions = {}) {
	const store = bentostore().useL1Layer(memoryDriver({ maxSize }))
	return new BentoCache({
		default: 'primary',
		stores: {
			primary: redis
				? store
						.useL2Layer(redisDriver({ connection: redis }))
						.useBus(redisBusDriver({ connection: redis }))
				: store,
		},
	})
}

export type CacheClient = ReturnType<typeof createCache>
