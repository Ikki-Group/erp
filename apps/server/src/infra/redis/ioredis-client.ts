import Redis from 'ioredis'

import { getLogger } from '@/infra/logger/index.ts'
import { env } from '@/shared/config/env.ts'

const logger = getLogger(['redis'])

// ioredis reconnects by itself; without an `error` listener every failed attempt is
// printed as "Unhandled error event". `duplicate()` (used by the BentoCache bus for its
// publisher/subscriber) builds fresh clients without listeners, so attach to those too.
function withErrorLogging(client: Redis): Redis {
	client.on('error', (error: Error) => {
		logger.warn('Redis connection error', { error: error.message })
	})
	const duplicate = client.duplicate.bind(client)
	client.duplicate = (override) => withErrorLogging(duplicate(override))
	return client
}

/**
 * The single shared ioredis connection (BentoCache L2 + bus, session store).
 * `undefined` when `REDIS_URL` is unset — callers fall back to in-memory adapters.
 */
export const redisConnection = env.REDIS_URL
	? withErrorLogging(new Redis(env.REDIS_URL))
	: undefined

/** Gracefully close the shared connection; no-op when Redis is not configured. */
export async function closeRedis(): Promise<void> {
	if (redisConnection && redisConnection.status !== 'end') await redisConnection.quit()
}
