import { RedisClient } from 'bun'

import { env } from '@/shared/config/env.ts'

/**
 * Shared Bun-native Redis client used for session storage.
 * `undefined` when `REDIS_URL` is unset — callers fall back to the in-memory session store.
 */
export const bunRedisClient = env.REDIS_URL ? new RedisClient(env.REDIS_URL) : undefined
