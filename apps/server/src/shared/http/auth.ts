import { UnauthorizedError } from '@/shared/errors/http-error'

export interface AuthenticatedUser {
	id: number
	email: string
	username: string
	fullname: string
	isActive: boolean
	/** Whether the user holds a global-scoped role (e.g. OWNER). */
	hasGlobalAccess: boolean
	createdAt: Date
	updatedAt: Date
	createdBy: number
	updatedBy: number
}

export class AuthContext {
	constructor(public user: AuthenticatedUser | null) {}

	get isAuthenticated(): boolean {
		return this.user !== null
	}

	get userId(): number {
		if (!this.isAuthenticated)
			throw new UnauthorizedError('Unauthorized', { code: 'AUTH_UNAUTHORIZED' })
		return this.user!.id
	}

	/** True if the authenticated user has a global-scoped role. */
	get hasGlobalAccess(): boolean {
		if (!this.isAuthenticated) return false
		return this.user!.hasGlobalAccess
	}
}
