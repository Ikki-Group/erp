import { eq } from 'drizzle-orm'
import { Elysia } from 'elysia'

import { roles, userAssignments, users } from '@/db/schema/iam.ts'

import { db } from '@/infra/database/index.ts'
import { sessionStore } from '@/infra/session/index.ts'
import { getAuthAccessMap, invalidateAuthCache } from '@/shared/auth/access-cache.ts'
import { effectivePermissions } from '@/shared/auth/permission.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import {
	SESSION_COOKIE_NAME,
	OWNER_ROLE_CODE,
	AUTH_CACHE_TTL_SECONDS,
} from '@/shared/config/index.ts'
import { ForbiddenError, UnauthorizedError } from '@/shared/errors/http-error.ts'

const LOCATION_ID_HEADER = 'x-location-id'

interface AccessMap {
	userName: string
	isActive: boolean
	globalPermissions: string[]
	access: Record<string, string[]>
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

	for (const row of rows) {
		if (row.roleId !== null) roleIds.add(row.roleId)
		if (row.roleCode === OWNER_ROLE_CODE) isOwner = true
		const permissions = permissionsFromRole(row.rolePermissions)
		if (row.assignmentLocationId === null) {
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
		isOwner,
		roleIds: [...roleIds],
	}
}

async function resolveAuth(
	sessionId: string,
	requestedLocationId: number | null,
): Promise<AuthContext> {
	const session = await sessionStore.get(sessionId)
	if (!session) throw new UnauthorizedError('Session expired or invalid')

	const accessMap = await getAuthAccessMap(
		session.userId,
		() => loadAccessMap(session.userId),
		AUTH_CACHE_TTL_SECONDS,
	)

	if (
		requestedLocationId !== null &&
		!accessMap.isOwner &&
		accessMap.globalPermissions.length === 0 &&
		!accessMap.access[String(requestedLocationId)]
	) {
		throw new ForbiddenError('Location access denied', {
			code: 'LOCATION_ACCESS_DENIED',
			context: { locationId: requestedLocationId },
		})
	}

	const auth: AuthContext = {
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
	async ({ cookie, headers }): Promise<{ auth: AuthContext }> => {
		const sessionCookie = cookie[SESSION_COOKIE_NAME]
		const sessionId = sessionCookie ? String(sessionCookie.value) : undefined
		if (!sessionId) throw new UnauthorizedError('Session cookie missing')

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
