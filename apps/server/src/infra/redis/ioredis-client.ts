import Redis from 'ioredis'

import { env } from '@/shared/config/env.ts'

/**
 * Shared ioredis connection used as BentoCache's L2 (Redis) layer.
 * `undefined` when `REDIS_URL` is unset — callers fall back to L1-memory-only caching.
 */
export const redisConnection = env.REDIS_URL ? new Redis(env.REDIS_URL) : undefined
