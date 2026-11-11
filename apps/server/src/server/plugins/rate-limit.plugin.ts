import { Elysia } from 'elysia'

import { getLogger } from '@/infra/logger/index.ts'
import { redisConnection } from '@/infra/redis/index.ts'
import { env, isTest } from '@/shared/config/env.ts'
import { TooManyRequestsError } from '@/shared/errors/http-error.ts'

import type Redis from 'ioredis'

const logger = getLogger(['server', 'rate-limit'])

// ─── Stores ───

interface RateLimitHit {
	count: number
	/** Seconds until the current window resets. */
	resetSeconds: number
}

export interface RateLimitStore {
	hit(key: string, windowSeconds: number): Promise<RateLimitHit>
}

export function createMemoryRateLimitStore(): RateLimitStore {
	const windows = new Map<string, { count: number; expiresAt: number }>()
	return {
		hit(key, windowSeconds) {
			const now = Date.now()
			// Opportunistic sweep keeps the map bounded without a timer.
			if (windows.size > 10_000) {
				for (const [k, w] of windows) if (w.expiresAt <= now) windows.delete(k)
			}
			let entry = windows.get(key)
			if (!entry || entry.expiresAt <= now) {
				entry = { count: 0, expiresAt: now + windowSeconds * 1000 }
				windows.set(key, entry)
			}
			entry.count++
			return Promise.resolve({
				count: entry.count,
				resetSeconds: Math.ceil((entry.expiresAt - now) / 1000),
			})
		},
	}
}

function createRedisRateLimitStore(redis: Redis): RateLimitStore {
	return {
		async hit(key, windowSeconds) {
			const result = await redis.multi().incr(key).expire(key, windowSeconds, 'NX').ttl(key).exec()
			const count = Number(result?.[0]?.[1] ?? 1)
			const ttl = Number(result?.[2]?.[1] ?? windowSeconds)
			return { count, resetSeconds: ttl > 0 ? ttl : windowSeconds }
		},
	}
}

// ─── Client identity ───

type RequestIpServer = { requestIP(request: Request): { address: string } | null } | null

function clientIp(request: Request, server: RequestIpServer | undefined): string {
	const fly = request.headers.get('fly-client-ip')
	if (fly) return fly.trim()
	const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
	if (forwarded) return forwarded
	return server?.requestIP(request)?.address ?? 'unknown'
}

function usernameOf(body: unknown): string {
	if (typeof body === 'object' && body !== null && 'username' in body) {
		const { username } = body
		if (typeof username === 'string') return username.trim().toLowerCase()
	}
	return ''
}

// ─── Plugin ───

export interface RateLimitOptions {
	/** Key namespace, e.g. 'auth-login'. */
	name: string
	max?: number
	windowSeconds?: number
	/** Defaults to AUTH_RATE_LIMIT_ENABLED, else enabled outside NODE_ENV=test. */
	enabled?: boolean
	store?: RateLimitStore
}

/**
 * Fixed-window limiter keyed by client IP + username. Opt routes in with
 * `{ rateLimit: true }`. Redis-backed when REDIS_URL is set, else in-memory.
 */
export function rateLimitPlugin(options: RateLimitOptions) {
	const max = options.max ?? env.AUTH_RATE_LIMIT_MAX
	const windowSeconds = options.windowSeconds ?? env.AUTH_RATE_LIMIT_WINDOW_SECONDS
	const enabled = options.enabled ?? env.AUTH_RATE_LIMIT_ENABLED ?? !isTest
	const store =
		options.store ??
		(redisConnection ? createRedisRateLimitStore(redisConnection) : createMemoryRateLimitStore())

	return new Elysia({ name: `rate-limit:${options.name}` }).macro({
		rateLimit: (on: boolean) => ({
			async beforeHandle({ request, server, body, set }) {
				if (!on || !enabled) return
				const ip = clientIp(request, server)
				const key = `ratelimit:${options.name}:${ip}:${usernameOf(body)}`
				const { count, resetSeconds } = await store.hit(key, windowSeconds)
				if (count > max) {
					set.headers['retry-after'] = String(resetSeconds)
					logger.warn('Rate limit exceeded', { name: options.name, ip })
					throw new TooManyRequestsError('Too many attempts, please try again later', {
						code: 'RATE_LIMITED',
						context: { retryAfterSeconds: resetSeconds },
					})
				}
			},
		}),
	})
}
