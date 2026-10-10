import { cache } from '@/infra/cache.ts'
import { db } from '@/infra/database/index.ts'
import { getLogger } from '@/infra/logger/index.ts'
import { SESSION_LAST_SEEN_THROTTLE_SECONDS, SESSION_TTL_DAYS } from '@/shared/config/index.ts'
import { UnauthorizedError } from '@/shared/errors/http-error.ts'

import { SessionRepo } from '@/modules/auth/session/session.repo.ts'

const logger = getLogger(['auth', 'session'])
const repo = new SessionRepo(db)

interface CachedSession {
	userId: number
	expiresAt: number
}

/**
 * Bearer tokens are 256-bit random values. Only their SHA-256 is stored, so a
 * leaked `sessions` table cannot be replayed as live tokens.
 */
export function newSessionToken(): { token: string; id: string; expiresAt: Date } {
	const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')
	const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
	return { token, id: sessionIdOf(token), expiresAt }
}

export function sessionIdOf(token: string): string {
	return new Bun.CryptoHasher('sha256').update(token).digest('hex')
}

const sessionKey = (id: string) => `session:${id}`

/** Cache-first session lookup; `sessions` in Postgres is the source of truth (ADR-0018). */
export async function resolveSession(id: string): Promise<{ id: string; userId: number }> {
	const session = await cache.getOrSet<CachedSession | null>({
		key: sessionKey(id),
		ttl: '10m',
		factory: async () => {
			const row = await repo.findById(id)
			if (!row || row.revokedAt !== null) return null
			return { userId: row.userId, expiresAt: row.expiresAt.getTime() }
		},
	})
	if (!session || session.expiresAt <= Date.now()) {
		throw new UnauthorizedError('Session expired or invalid', { code: 'SESSION_EXPIRED' })
	}
	touchLastSeen(id)
	return { id, userId: session.userId }
}

/** Drop revoked sessions from every instance's cache. */
export async function forgetSessions(ids: string[]): Promise<void> {
	if (ids.length > 0) await cache.deleteMany({ keys: ids.map(sessionKey) })
}

/** Writes `last_seen_at` at most once per throttle window; never blocks the request. */
function touchLastSeen(id: string): void {
	cache
		.getOrSet({
			key: `session:lastseen:${id}`,
			ttl: `${SESSION_LAST_SEEN_THROTTLE_SECONDS}s`,
			factory: async () => {
				await repo.touchLastSeen(id)
				return true
			},
		})
		.catch((error: unknown) => logger.warn('Failed to update last_seen_at', { error }))
}
