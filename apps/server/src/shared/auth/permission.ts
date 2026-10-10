import { ForbiddenError } from '@/shared/errors/http-error.ts'

/** Materialized authorization state of a user (CONTEXT.md "Access map"). */
export interface AccessMap {
	isOwner: boolean
	/** Permissions from global (location-less) assignments. */
	globalPermissions: string[]
	/** Permissions per location id. */
	access: Record<string, string[]>
}

export interface AuthContext extends AccessMap {
	sessionId: string
	userId: number
	userName: string
	/** Active location from the `x-location-id` header; null = consolidated view. */
	locationId: number | null
	/** Effective permissions for the active location (global + location). */
	permissions: string[]
	/** Whether the user holds `permission` at `locationId` (null = global only). */
	can(permission: string, locationId: number | null): boolean
	/** Throws 403 unless the route's permission holds at `locationId`. */
	assertCan(locationId: number | null): void
	/** Locations where the route's permission holds; null = everywhere (global grant). */
	allowedLocations(): number[] | null
}

export function effectivePermissions(map: AccessMap, locationId: number | null): string[] {
	const local = locationId === null ? [] : (map.access[String(locationId)] ?? [])
	return [...new Set([...map.globalPermissions, ...local])]
}

/** Available to every authenticated session, independent of the active location. */
export const AUTH_UTILITY_PERMISSIONS = new Set([
	'auth.me',
	'auth.logout',
	'auth.session.list',
	'auth.session.revoke',
])

export function hasPermission(auth: AuthContext, permission: string): boolean {
	return (
		auth.isOwner ||
		AUTH_UTILITY_PERMISSIONS.has(permission) ||
		auth.permissions.includes(permission)
	)
}

/** Throws ForbiddenError if the user lacks the required permission. */
export function requirePermission(auth: AuthContext, permission: string): void {
	if (!hasPermission(auth, permission)) {
		throw new ForbiddenError('Insufficient permissions', {
			code: 'PERMISSION_DENIED',
			context: { required: permission },
		})
	}
}

/** Throws ForbiddenError if the user lacks ALL of the specified permissions. */
export function requireAnyPermission(auth: AuthContext, permissions: string[]): void {
	if (!permissions.some((permission) => hasPermission(auth, permission))) {
		throw new ForbiddenError('Insufficient permissions', {
			code: 'PERMISSION_DENIED',
			context: { requiredAny: permissions },
		})
	}
}
