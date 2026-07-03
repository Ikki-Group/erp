import { Redis } from 'ioredis'
import { BentoCache, BentoStore, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { redisBusDriver, redisDriver } from 'bentocache/drivers/redis'

export type CacheClient = BentoCache<{
	cache: BentoStore
}>

export type CacheProvider = ReturnType<CacheClient['namespace']>

export interface CreateCacheOptions {
	/**
	 * Standard `redis://` or `rediss://` connection string (Upstash "Redis Connect"
	 * tab — NOT the REST URL/token pair, ioredis cannot use those).
	 *
	 * When omitted, the cache runs L1-memory-only:
	 *   - Fine for local dev / unit tests (fast, zero network dependency).
	 *   - NOT recommended for production: on Fly.io with `auto_stop_machines`,
	 *     an in-memory-only cache is wiped on every cold start, and is never
	 *     shared across concurrently running machines — every miss falls
	 *     through to Neon, defeating the point of caching.
	 */
	redisUrl?: string | undefined
}

/**
 * Two ioredis connections are intentionally created when Redis is enabled:
 *   - `cache`: regular request/response commands (GET/SET/DEL/...).
 *   - `bus`:   dedicated subscriber connection for cross-instance cache
 *              invalidation (Redis Pub/Sub). A connection in subscribe mode
 *              cannot also issue regular commands, so it must be separate.
 *
 * Without the bus, every Fly.io machine would keep serving its own stale L1
 * (in-memory) copy after another machine invalidates/updates a key — the bus
 * is what makes multi-instance invalidation correct.
 */
function buildRedisLayer(redisUrl: string) {
	const commonRedisOptions = {
		maxRetriesPerRequest: 3,
		// Upstash idles/closes connections after inactivity — reconnect fast
		// instead of surfacing an error to the request.
		retryStrategy: (attempt: number) => Math.min(attempt * 200, 2000),
	}

	const cacheConnection = new Redis(redisUrl, commonRedisOptions)
	const busConnection = new Redis(redisUrl, commonRedisOptions)

	return {
		cacheConnection,
		busConnection,
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
		// Serve stale data for up to a day if Neon (or Redis) is slow/unreachable
		// instead of failing the request outright.
		grace: '1d',
		graceBackoff: '30s',
		stores: { cache: store },
	})
}
