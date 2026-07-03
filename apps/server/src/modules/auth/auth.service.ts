import { record } from '@elysiajs/opentelemetry'

import { verifyPassword } from '@/shared/utils/password'

import type { UserDto, UserWithPasswordDto } from '@/modules/iam'
import type { SessionService } from '@/modules/session/session.service'

import type { AuthOutputDto, AuthLoginDto } from './auth.contract'
import { AuthError } from './auth.internal'

/**
 * Narrow IAM surface that AuthService depends on — instead of the whole
 * `IamModule`. Keeps the coupling explicit and minimal, and makes AuthService
 * trivially unit-testable with a tiny fake.
 */
export interface IamAuthPort {
	getByIdentifier(identifier: string): Promise<UserWithPasswordDto | undefined>
	getUserDetail(userId: number): Promise<UserDto>
}

export class AuthService {
	constructor(
		private readonly iam: IamAuthPort,
		private readonly sessionSvc: SessionService,
	) {}

	async login(input: AuthLoginDto): Promise<AuthOutputDto> {
		return record('AuthService.login', async () => {
			const { identifier, password } = input
			const targetUser = await this.iam.getByIdentifier(identifier)

			if (!targetUser || !targetUser.isActive) {
				throw AuthError.userNotFound()
			}

			const isPasswordValid = await verifyPassword(password, targetUser.passwordHash!)
			if (!isPasswordValid) {
				throw AuthError.invalidCredentials()
			}

			const session = await this.sessionSvc.createSession(targetUser)
			const userDetail = await this.iam.getUserDetail(targetUser.id)

			return { user: userDetail, token: session.token }
		})
	}

	async verifyToken(token: string): Promise<UserDto> {
		return record('AuthService.verifyToken', async () => {
			const session = await this.sessionSvc.verifySession(token)
			if (!session) {
				throw AuthError.invalidToken()
			}

			return this.iam.getUserDetail(session.userId)
		})
	}

	async getById(userId: number): Promise<UserDto | undefined> {
		return record('AuthService.getById', async () => {
			return this.iam.getUserDetail(userId)
		})
	}
}
