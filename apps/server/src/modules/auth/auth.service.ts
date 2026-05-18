import { UnauthorizedError } from '@/shared/errors/http-error'
import { verifyPassword } from '@/shared/utils/password'

import type { IamServiceModule, UserSchema } from '@/modules/iam'
import type { SessionService } from '@/modules/session/session.service'

import type { AuthOutputSchema, AuthLoginSchema } from './auth.schema'

const err = {
	userNotFound: () => new UnauthorizedError('User not found', 'AUTH_USER_NOT_FOUND'),
	invalidCredentials: () =>
		new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS'),
}

export class AuthService {
	constructor(
		private readonly iam: IamServiceModule,
		private readonly sessionSvc: SessionService,
	) {}

	async login(input: AuthLoginSchema): Promise<AuthOutputSchema> {
		const { identifier, password } = input
		const targetUser = await this.iam.user.getByIdentifier(identifier)

		if (!targetUser || !targetUser.isActive) {
			throw err.userNotFound()
		}

		const isPasswordValid = await verifyPassword(password, targetUser.passwordHash)
		if (!isPasswordValid) {
			throw err.invalidCredentials()
		}

		const session = await this.sessionSvc.createSession(targetUser)
		const userDetail = await this.iam.userRead.getDetailById(targetUser.id)

		return { user: userDetail, token: session.token }
	}

	async verifyToken(token: string): Promise<UserSchema> {
		const session = await this.sessionSvc.verifySession(token)
		if (!session) {
			throw err.invalidCredentials()
		}

		return this.iam.userRead.getDetailById(session.userId)
	}

	async getById(userId: number): Promise<UserSchema | undefined> {
		return this.iam.userRead.getDetailById(userId)
	}
}
