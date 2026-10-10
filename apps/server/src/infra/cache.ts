import { BentoCache, bentostore } from 'bentocache'
import { memoryDriver } from 'bentocache/drivers/memory'
import { redisBusDriver, redisDriver } from 'bentocache/drivers/redis'
import Redis from 'ioredis'

import { env } from '@/shared/config/env.ts'

/**
 * The single application cache. Only the auth hot path uses it (session
 * lookup, access map, last-seen throttle) — business reads go straight to
 * Postgres, so there is no invalidation to get wrong.
 *
 * L1 is per-process memory. With REDIS_URL set, Redis becomes L2 and a bus
 * keeps every instance's L1 coherent, so a revoke/role change on one machine
 * is seen by all of them.
 */
const store = bentostore().useL1Layer(memoryDriver({ maxSize: 10_000 }))

if (env.REDIS_URL) {
	store
		.useL2Layer(redisDriver({ connection: new Redis(env.REDIS_URL) }))
		.useBus(redisBusDriver({ connection: new Redis(env.REDIS_URL) }))
}

export const cache = new BentoCache({ default: 'app', stores: { app: store } })
