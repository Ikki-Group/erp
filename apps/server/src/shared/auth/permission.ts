import { ForbiddenError } from '@/shared/errors/http-error.ts'

// ─── Types ───

export interface AuthContext {
	userId: number
	locationId: number | null
	permissions: string[]
	isOwner: boolean
}

// ─── Permission Helpers ───

/** Returns true if the user has the specified permission (or is owner). */
export function hasPermission(auth: AuthContext, permission: string): boolean {
	if (auth.isOwner) return true
	return auth.permissions.includes(permission)
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
	const has = permissions.some((p) => auth.permissions.includes(p))
	if (!has) {
		throw new ForbiddenError('Insufficient permissions', {
			code: 'PERMISSION_DENIED',
			context: { requiredAny: permissions },
		})
	}
}
