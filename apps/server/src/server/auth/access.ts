import { eq } from 'drizzle-orm'

import { roles, userAssignments, users } from '@/db/schema/iam.ts'

import { cache } from '@/infra/cache.ts'
import { db } from '@/infra/database/index.ts'
import type { AccessMap } from '@/shared/auth/permission.ts'
import { AUTH_CACHE_TTL_SECONDS, OWNER_ROLE_CODE } from '@/shared/config/index.ts'
import { UnauthorizedError } from '@/shared/errors/http-error.ts'

export interface UserAccess extends AccessMap {
	userName: string
	hasGlobalAssignment: boolean
}

const accessKey = (userId: number) => `access:${userId}`
const roleTag = (roleId: number) => `role:${roleId}`

/** Cached per user and tagged by role, so a role edit invalidates every holder. */
export async function getUserAccess(userId: number): Promise<UserAccess> {
	const access = await cache.getOrSet<UserAccess | null>({
		key: accessKey(userId),
		ttl: `${AUTH_CACHE_TTL_SECONDS}s`,
		factory: async (ctx) => {
			const loaded = await loadUserAccess(userId)
			if (loaded) ctx.setTags(loaded.roleIds.map(roleTag))
			return loaded?.access ?? null
		},
	})
	if (!access) throw new UnauthorizedError('User not found or deactivated')
	return access
}

export async function invalidateUserAccess(userId: number): Promise<void> {
	await cache.delete({ key: accessKey(userId) })
}

export async function invalidateRoleAccess(roleId: number): Promise<void> {
	await cache.deleteByTag({ tags: [roleTag(roleId)] })
}

/** One joined query materializes the whole access map. */
async function loadUserAccess(
	userId: number,
): Promise<{ access: UserAccess; roleIds: number[] } | undefined> {
	const rows = await db
		.select({
			userName: users.name,
			isActive: users.isActive,
			locationId: userAssignments.locationId,
			roleId: roles.id,
			roleCode: roles.code,
			permissions: roles.permissions,
		})
		.from(users)
		.leftJoin(userAssignments, eq(userAssignments.userId, users.id))
		.leftJoin(roles, eq(roles.id, userAssignments.roleId))
		.where(eq(users.id, userId))

	const first = rows[0]
	if (!first?.isActive) return undefined

	const global = new Set<string>()
	const byLocation = new Map<string, Set<string>>()
	const roleIds = new Set<number>()
	let isOwner = false
	let hasGlobalAssignment = false

	for (const row of rows) {
		if (row.roleId === null) continue
		roleIds.add(row.roleId)
		if (row.roleCode === OWNER_ROLE_CODE) isOwner = true
		let target = global
		if (row.locationId === null) {
			hasGlobalAssignment = true
		} else {
			const key = String(row.locationId)
			target = byLocation.get(key) ?? new Set()
			byLocation.set(key, target)
		}
		for (const permission of row.permissions ?? []) target.add(permission)
	}

	return {
		roleIds: [...roleIds],
		access: {
			userName: first.userName,
			isOwner,
			hasGlobalAssignment,
			globalPermissions: [...global],
			access: Object.fromEntries([...byLocation].map(([id, set]) => [id, [...set]])),
		},
	}
}
