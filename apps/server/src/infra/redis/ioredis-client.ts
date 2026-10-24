import Redis from 'ioredis'

import { getLogger } from '@/infra/logger/index.ts'
import { env } from '@/shared/config/env.ts'

const logger = getLogger(['redis'])

/**
 * The single shared ioredis connection (BentoCache L2 + bus, session store).
 * `undefined` when `REDIS_URL` is unset — callers fall back to in-memory adapters.
 */
export const redisConnection = env.REDIS_URL ? new Redis(env.REDIS_URL) : undefined

// ioredis reconnects by itself; without a listener every failed attempt is printed as
// "Unhandled error event".
redisConnection?.on('error', (error) => {
	logger.warn('Redis connection error', { error: error.message })
})

/** Gracefully close the shared connection; no-op when Redis is not configured. */
export async function closeRedis(): Promise<void> {
	if (redisConnection && redisConnection.status !== 'end') await redisConnection.quit()
}
