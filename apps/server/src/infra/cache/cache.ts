import { BentoCache, BentoStore, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { redisBusDriver, redisDriver } from 'bentocache/drivers/redis'
import { Redis } from 'ioredis'

export type CacheClient = BentoCache<{
	cache: BentoStore
}>

export type CacheProvider = ReturnType<CacheClient['namespace']>

export interface CreateCacheOptions {
	/** Redis connection URL. When omitted, cache runs L1-memory-only (dev/test). */
	redisUrl?: string | undefined
}

function buildRedisLayer(redisUrl: string) {
	const commonRedisOptions = {
		maxRetriesPerRequest: 3,
		retryStrategy: (attempt: number) => Math.min(attempt * 200, 2000),
	}

	return {
		cacheConnection: new Redis(redisUrl, commonRedisOptions),
		busConnection: new Redis(redisUrl, commonRedisOptions),
	}
}

export function createCache(options: CreateCacheOptions = {}): CacheClient {
	const { redisUrl } = options

	const store = bentostore().useL1Layer(memoryDriver({ maxSize: '15mb', maxEntrySize: '256kb' }))

	if (redisUrl) {
		const { cacheConnection, busConnection } = buildRedisLayer(redisUrl)

		store
			.useL2Layer(redisDriver({ connection: cacheConnection }))
			.useBus(redisBusDriver({ connection: busConnection }))
	}

	return new BentoCache({
		default: 'cache',
		ttl: '10m',
		grace: '1d',
		graceBackoff: '30s',
		stores: { cache: store },
	})
}
