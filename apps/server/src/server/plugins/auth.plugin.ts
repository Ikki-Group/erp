import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'

import { roles, userAssignments, users } from '@/db/schema/iam.ts'

import { cache as cacheClient } from '@/infra/cache/index.ts'
import { db } from '@/infra/database/index.ts'
import { getLogger } from '@/infra/logger/index.ts'
import { sessionStore } from '@/infra/session/index.ts'
import { getAuthAccessMap, invalidateAuthCache } from '@/shared/auth/access-cache.ts'
import { effectivePermissions } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import type { SessionData } from '@/shared/auth/session.port.ts'
import {
	OWNER_ROLE_CODE,
	AUTH_CACHE_TTL_SECONDS,
	SESSION_LAST_SEEN_THROTTLE_SECONDS,
} from '@/shared/config/index.ts'
import { ForbiddenError, UnauthorizedError } from '@/shared/errors/http-error.ts'

import { SessionRepo } from '@/modules/auth/session/session.repo.ts'

const LOCATION_ID_HEADER = 'x-location-id'

const logger = getLogger(['auth', 'session'])

// The plugin avoids depending on the `auth` module's service/route layer (that
// would cycle back here); it only reaches for the leaf `SessionRepo` class,
// mirroring how `loadAccessMap` below queries IAM tables directly instead of
// going through the `iam` module.
const sessionRepo = new SessionRepo(db)

interface AccessMap {
	userName: string
	isActive: boolean
	globalPermissions: string[]
	access: Record<string, string[]>
	hasGlobalAssignment: boolean
	isOwner: boolean
	roleIds: number[]
}

function permissionsFromRole(value: unknown): string[] {
	if (!Array.isArray(value)) return []
	return value.filter((permission): permission is string => typeof permission === 'string')
}

/** Materialize the complete access map in one joined query on cache miss. */
async function loadAccessMap(userId: number): Promise<AccessMap> {
	const rows = await db
		.select({
			userName: users.name,
			isActive: users.isActive,
			assignmentLocationId: userAssignments.locationId,
			roleId: roles.id,
			roleCode: roles.code,
			rolePermissions: roles.permissions,
		})
		.from(users)
		.leftJoin(userAssignments, eq(userAssignments.userId, users.id))
		.leftJoin(roles, eq(roles.id, userAssignments.roleId))
		.where(eq(users.id, userId))

	const first = rows[0]
	if (!first) throw new UnauthorizedError('User not found')
	if (!first.isActive) throw new UnauthorizedError('User is deactivated')

	const globalPermissions = new Set<string>()
	const roleIds = new Set<number>()
	const access = new Map<string, Set<string>>()
	let isOwner = false
	let hasGlobalAssignment = false

	for (const row of rows) {
		if (row.roleId !== null) roleIds.add(row.roleId)
		if (row.roleCode === OWNER_ROLE_CODE) isOwner = true
		const permissions = permissionsFromRole(row.rolePermissions)
		if (row.roleId !== null && row.assignmentLocationId === null) {
			hasGlobalAssignment = true
			for (const permission of permissions) globalPermissions.add(permission)
			continue
		}
		const locationPermissions = access.get(String(row.assignmentLocationId)) ?? new Set<string>()
		for (const permission of permissions) locationPermissions.add(permission)
		access.set(String(row.assignmentLocationId), locationPermissions)
	}

	return {
		userName: first.userName,
		isActive: first.isActive,
		globalPermissions: [...globalPermissions],
		access: Object.fromEntries(
			[...access].map(([locationId, permissions]) => [locationId, [...permissions]]),
		),
		hasGlobalAssignment,
		isOwner,
		roleIds: [...roleIds],
	}
}

/**
 * Cache-first session lookup with a DB fallback (source of truth). A cache
 * miss (Redis/memory eviction, restart, etc.) falls back to `sessions` in
 * Postgres; a valid row rehydrates the cache so subsequent requests hit the
 * fast path again.
 */
async function resolveSession(sessionId: string): Promise<SessionData> {
	const cached = await sessionStore.get(sessionId)
	if (cached) return cached

	const row = await sessionRepo.findById(sessionId)
	const isValid = row !== undefined && row.revokedAt === null && row.expiresAt > new Date()
	if (!row || !isValid) throw new UnauthorizedError('Session expired or invalid')

	const session: SessionData = { id: row.id, userId: row.userId, expiresAt: row.expiresAt }
	await sessionStore.create(session)
	return session
}

/**
 * Throttled "heartbeat" — writes `sessions.last_seen_at` at most once per
 * `SESSION_LAST_SEEN_THROTTLE_SECONDS`, using the cache as a debounce so the
 * hot auth path never waits on this write. Fire-and-forget by callers.
 */
async function touchLastSeen(sessionId: string): Promise<void> {
	await cacheClient.getOrSet({
		key: `auth:session:lastseen:${sessionId}`,
		factory: async () => {
			await sessionRepo.touchLastSeen(sessionId)
			return true
		},
		ttl: `${SESSION_LAST_SEEN_THROTTLE_SECONDS}s`,
	})
}

async function resolveAuth(
	sessionId: string,
	requestedLocationId: number | null,
): Promise<AuthContext> {
	const session = await resolveSession(sessionId)
	touchLastSeen(sessionId).catch((error: unknown) => {
		logger.warn('Failed to update session last_seen_at', { sessionId, error })
	})

	const accessMap = await getAuthAccessMap(
		session.userId,
		() => loadAccessMap(session.userId),
		AUTH_CACHE_TTL_SECONDS,
	)

	if (
		requestedLocationId !== null &&
		!accessMap.isOwner &&
		!accessMap.hasGlobalAssignment &&
		!accessMap.access[String(requestedLocationId)]
	) {
		throw new ForbiddenError('Location access denied', {
			code: 'LOCATION_ACCESS_DENIED',
			context: { locationId: requestedLocationId },
		})
	}

	const auth: AuthContext = {
		sessionId,
		userId: session.userId,
		userName: accessMap.userName,
		locationId: requestedLocationId,
		permissions: [],
		isOwner: accessMap.isOwner,
		globalPermissions: accessMap.globalPermissions,
		access: accessMap.access,
	}
	return { ...auth, permissions: effectivePermissions(auth) }
}

export const authPlugin = new Elysia({ name: 'auth-plugin' }).derive(
	{ as: 'scoped' },
	async ({ headers }): Promise<{ auth: AuthContext }> => {
		const authHeader = headers['authorization']
		const sessionId = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
		if (!sessionId) throw new UnauthorizedError('Authorization header missing')

		const rawLocationId = headers[LOCATION_ID_HEADER]
		const requestedLocationId = rawLocationId === undefined ? null : Number(rawLocationId)
		if (rawLocationId !== undefined && !Number.isInteger(requestedLocationId)) {
			throw new ForbiddenError('Invalid location header', {
				code: 'INVALID_LOCATION_HEADER',
			})
		}

		return { auth: await resolveAuth(sessionId, requestedLocationId) }
	},
)

export { invalidateAuthCache }
