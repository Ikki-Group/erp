import { eq, inArray } from 'drizzle-orm'
import { Elysia } from 'elysia'

import { roles, userAssignments, users } from '@/db/schema/iam.ts'

import { cache } from '@/infra/cache/index.ts'
import { db } from '@/infra/database/index.ts'
import { sessionStore } from '@/infra/session/index.ts'
import type { AuthContext } from '@/shared/auth/permission.ts'
import {
	SESSION_COOKIE_NAME,
	OWNER_ROLE_CODE,
	AUTH_CACHE_TTL_SECONDS,
} from '@/shared/config/index.ts'
import { UnauthorizedError } from '@/shared/errors/http-error.ts'

// ─── Cache Keys ───

function authCacheKey(sessionId: string): string {
	return `auth:session:${sessionId}`
}

// ─── Permission Loader (uncached) ───

async function loadPermissions(
	userId: number,
	locationId: number | null,
): Promise<{ userName: string; permissions: string[]; isOwner: boolean }> {
	const user = await db
		.select({ name: users.name })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)
		.then((rows) => rows[0])
	if (!user) throw new UnauthorizedError('User not found')

	// Find all assignments for this user
	const assignments = await db
		.select({
			roleId: userAssignments.roleId,
			locationId: userAssignments.locationId,
		})
		.from(userAssignments)
		.where(eq(userAssignments.userId, userId))

	// Filter to relevant assignments (matching location or global)
	const relevantAssignments = assignments.filter(
		(a) => a.locationId === null || a.locationId === locationId,
	)

	if (relevantAssignments.length === 0) {
		return { userName: user.name, permissions: [], isOwner: false }
	}

	// Load roles for these assignments
	const roleIds = [...new Set(relevantAssignments.map((a) => a.roleId))]
	const userRoles = await db
		.select({
			code: roles.code,
			permissions: roles.permissions,
		})
		.from(roles)
		.where(inArray(roles.id, roleIds))

	// Check if user is owner
	const isOwner = userRoles.some((r) => r.code === OWNER_ROLE_CODE)

	// Collect all permissions from all roles
	const permissions = userRoles.flatMap((r) => {
		const perms = r.permissions
		if (Array.isArray(perms)) return perms.filter((p): p is string => typeof p === 'string')
		return []
	})

	return { userName: user.name, permissions: [...new Set(permissions)], isOwner }
}

// ─── Resolve Auth (with cache) ───

/**
 * Resolves the full AuthContext for a session ID.
 * Cached for AUTH_CACHE_TTL_SECONDS to avoid DB calls on every request.
 */
async function resolveAuth(sessionId: string): Promise<AuthContext> {
	return cache.getOrSet({
		key: authCacheKey(sessionId),
		factory: async () => {
			const session = await sessionStore.get(sessionId)
			if (!session) {
				throw new UnauthorizedError('Session expired or invalid')
			}

			const { userName, permissions, isOwner } = await loadPermissions(
				session.userId,
				session.locationId,
			)

			return {
				userId: session.userId,
				userName,
				locationId: session.locationId,
				permissions,
				isOwner,
			}
		},
		ttl: AUTH_CACHE_TTL_SECONDS,
	})
}

/**
 * Invalidate cached auth for a session (call on logout, role change, location switch).
 */
export async function invalidateAuthCache(sessionId: string): Promise<void> {
	await cache.delete({ key: authCacheKey(sessionId) })
}

// ─── Auth Plugin with Derive ───

export const authPlugin = new Elysia({ name: 'auth-plugin' }).derive(
	{ as: 'scoped' },
	async ({ cookie }): Promise<{ auth: AuthContext }> => {
		const sessionCookie = cookie[SESSION_COOKIE_NAME]
		const sessionId = sessionCookie ? String(sessionCookie.value) : undefined
		if (!sessionId) {
			throw new UnauthorizedError('Session cookie missing')
		}

		const auth = await resolveAuth(sessionId)
		return { auth }
	},
)

/**
 * Alias for route files:
 * ```ts
 * import { authPluginMacro } from '@/server/plugins/auth.plugin.ts'
 * new Elysia().use(authPluginMacro).get('/items', ({ auth }) => { ... })
 * ```
 */
export const authPluginMacro = authPlugin
