import { ForbiddenError } from '@/shared/errors/http-error.ts'

// ─── Types ───

/** The authenticated session plus everything the user may do, per location. */
export interface AuthContext {
	sessionId: string
	userId: number
	userName: string
	/** Active location from the `x-location-id` header; null when none is selected. */
	locationId: number | null
	isOwner: boolean
	/** Permissions granted by global (location-less) assignments. */
	globalPermissions: string[]
	/** Location id → permissions granted by assignments at that location. */
	access: Record<string, string[]>
}

// Authentication utility endpoints are available to every authenticated session,
// independent of the active business location.
const AUTH_UTILITY_PERMISSIONS: Record<string, true> = {
	'auth.me': true,
	'auth.logout': true,
	'auth.session.list': true,
	'auth.session.revoke': true,
}

// ─── Queries ───

/** Global plus location permissions; `locationId` null = global only. */
export function permissionsAt(auth: AuthContext, locationId: number | null): string[] {
	const atLocation = locationId === null ? [] : (auth.access[String(locationId)] ?? [])
	return [...new Set([...auth.globalPermissions, ...atLocation])]
}

/** Whether `permission` holds at `locationId` (null = it must hold globally). */
export function can(auth: AuthContext, permission: string, locationId: number | null): boolean {
	if (auth.isOwner || AUTH_UTILITY_PERMISSIONS[permission]) return true
	if (auth.globalPermissions.includes(permission)) return true
	if (locationId === null) return false
	return auth.access[String(locationId)]?.includes(permission) ?? false
}

/** Locations where `permission` holds; null = every location (global grant). */
export function allowedLocations(auth: AuthContext, permission: string): number[] | null {
	if (can(auth, permission, null)) return null
	return Object.entries(auth.access)
		.filter(([, permissions]) => permissions.includes(permission))
		.map(([locationId]) => Number(locationId))
}

// ─── Assertions ───

function permissionDenied(required: string, locationId: number | null): ForbiddenError {
	return new ForbiddenError('Insufficient permissions', {
		code: 'PERMISSION_DENIED',
		context: { required, locationId },
	})
}

/** Throws 403 unless `permission` holds at `locationId`. */
export function assertCan(auth: AuthContext, permission: string, locationId: number | null): void {
	if (!can(auth, permission, locationId)) throw permissionDenied(permission, locationId)
}
