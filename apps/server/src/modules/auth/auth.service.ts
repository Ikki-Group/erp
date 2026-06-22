import { record } from '@elysiajs/opentelemetry'

import { verifyPassword } from '@/shared/utils/password'

import type { IamModule, UserDto } from '@/modules/iam'
import type { SessionService } from '@/modules/session/session.service'

import type { AuthOutputSchema, AuthLoginSchema } from './auth.contract'
import { AuthError } from './auth.internal'

export class AuthService {
	constructor(
		private readonly iam: IamModule,
		private readonly sessionSvc: SessionService,
	) {}

	async login(input: AuthLoginSchema): Promise<AuthOutputSchema> {
		return record('AuthService.login', async () => {
			const { identifier, password } = input
			const targetUser = await this.iam.user.getByIdentifier(identifier)

			if (!targetUser || !targetUser.isActive) {
				throw AuthError.userNotFound()
			}

			const isPasswordValid = await verifyPassword(password, targetUser.passwordHash!)
			if (!isPasswordValid) {
				throw AuthError.invalidCredentials()
			}

			const session = await this.sessionSvc.createSession(targetUser)
			const userDetail = await this.iam.composed.getDetailById(targetUser.id)

			return { user: userDetail, token: session.token }
		})
	}

	async verifyToken(token: string): Promise<UserDto> {
		return record('AuthService.verifyToken', async () => {
			const session = await this.sessionSvc.verifySession(token)
			if (!session) {
				throw AuthError.invalidToken()
			}

			return this.iam.composed.getDetailById(session.userId)
		})
	}

	async getById(userId: number): Promise<UserDto | undefined> {
		return record('AuthService.getById', async () => {
			return this.iam.composed.getDetailById(userId)
		})
	}
}
