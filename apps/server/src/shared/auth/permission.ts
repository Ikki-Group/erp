import { ForbiddenError } from '@/shared/errors/http-error.ts'

// ─── Types ───

export interface AuthContext {
	userId: number
	userName: string
	locationId: number | null
	permissions: string[]
	isOwner: boolean
	globalPermissions?: string[]
	access?: Record<string, string[]>
}

export function effectivePermissions(auth: AuthContext, locationId = auth.locationId): string[] {
	const globalPermissions = auth.globalPermissions ?? auth.permissions
	const locationPermissions = locationId === null ? [] : (auth.access?.[String(locationId)] ?? [])
	return [...new Set([...globalPermissions, ...locationPermissions])]
}

// Authentication utility endpoints are available to every authenticated session,
// independent of the active business location.
const AUTH_UTILITY_PERMISSIONS = new Set(['auth.me', 'auth.logout'])

export function hasPermission(auth: AuthContext, permission: string): boolean {
	if (auth.isOwner || AUTH_UTILITY_PERMISSIONS.has(permission)) return true
	return effectivePermissions(auth).includes(permission)
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
	if (auth.isOwner) return
	const has = permissions.some((permission) => hasPermission(auth, permission))
	if (!has) {
		throw new ForbiddenError('Insufficient permissions', {
			code: 'PERMISSION_DENIED',
			context: { requiredAny: permissions },
		})
	}
}
