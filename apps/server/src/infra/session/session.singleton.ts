import { redisConnection } from '@/infra/redis/index.ts'
import { SESSION_MAX_AGE_SECONDS } from '@/shared/config/index.ts'

import { MemorySessionStore } from './session.memory.ts'
import { RedisSessionStore } from './session.redis.ts'

// Redis-backed store when REDIS_URL is configured; otherwise falls back to
// the in-memory adapter (e.g. local dev/tests) — mirrors the cache's L1/L2 split.
export const sessionStore = redisConnection
	? new RedisSessionStore({ client: redisConnection, ttlSeconds: SESSION_MAX_AGE_SECONDS })
	: new MemorySessionStore({ ttlSeconds: SESSION_MAX_AGE_SECONDS })
