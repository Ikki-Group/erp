import { UnauthorizedError } from '@/shared/errors/http-error'

export interface AuthenticatedUser {
	id: number
	email: string
	username: string
	fullname: string
	isActive: boolean
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

		// return 1
	}
}
