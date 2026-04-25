import { UnauthorizedError } from '@/core/http/errors'
import { verifyPassword } from '@/core/password'

import type { AuthOutputDto, LoginDto } from '@/modules/auth/dto'
import type { UserDetailDto, UserDto } from '@/modules/iam/dto'
import type { UserService, UserUsecases } from '@/modules/iam'

import type { SessionService } from './session.service'

const err = {
	userNotFound: () => new UnauthorizedError('User not found', 'AUTH_USER_NOT_FOUND'),
	invalidCredentials: () =>
		new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS'),
}

export class AuthService {
	constructor(
		private readonly userDomainSvc: UserService,
		private readonly userUsecases: UserUsecases,
		private readonly sessionSvc: SessionService,
	) {}

	async login(input: LoginDto): Promise<AuthOutputDto> {
		const { identifier, password } = input
		const targetUser = await this.userDomainSvc.getByIdentifier(identifier)

		if (!targetUser || !targetUser.isActive) {
			throw err.userNotFound()
		}

		const isPasswordValid = await verifyPassword(password, targetUser.passwordHash)
		if (!isPasswordValid) {
			throw err.invalidCredentials()
		}

		const session = await this.sessionSvc.createSession(targetUser)
		const userDetail = await this.userUsecases.getUserDetail(targetUser.id)

		return { user: userDetail, token: session.token }
	}

	async verifyToken(token: string): Promise<UserDto> {
		const session = await this.sessionSvc.verifySession(token)
		if (!session) {
			throw err.invalidCredentials()
		}

		const userWithAccess = await this.userUsecases.getUserDetail(session.userId)
		return userWithAccess
	}

	async getById(userId: number): Promise<UserDetailDto> {
		return this.userUsecases.getUserDetail(userId)
	}
}
