import Redis from 'ioredis'

import { env } from '@/shared/config/env.ts'

/**
 * The single shared ioredis connection (BentoCache L2 + bus, session store).
 * `undefined` when `REDIS_URL` is unset — callers fall back to in-memory adapters.
 */
export const redisConnection = env.REDIS_URL ? new Redis(env.REDIS_URL) : undefined

/** Gracefully close the shared connection; no-op when Redis is not configured. */
export async function closeRedis(): Promise<void> {
	if (redisConnection && redisConnection.status !== 'end') await redisConnection.quit()
}
