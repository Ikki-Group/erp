import { UnauthorizedError } from '@/core/http/errors'
import { verifyPassword } from '@/core/password'

import type { UserDetailDto, UserDto, UserService } from '@/modules/iam'

import type { SessionService } from '../session/session.service'
import type { AuthOutputDto, LoginDto } from './login.dto'

const err = {
	userNotFound: () => new UnauthorizedError('User not found', 'AUTH_USER_NOT_FOUND'),
	invalidCredentials: () =>
		new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS'),
}

export class LoginService {
	constructor(
		private readonly svc: {
			user: UserService
			session: SessionService
		},
	) {}

	async login(input: LoginDto): Promise<AuthOutputDto> {
		const { identifier, password } = input
		const targetUser = await this.svc.user.getByIdentifier(identifier)

		if (!targetUser || !targetUser.isActive) {
			throw err.userNotFound()
		}

		const isPasswordValid = await verifyPassword(password, targetUser.passwordHash)
		if (!isPasswordValid) {
			throw err.invalidCredentials()
		}

		const session = await this.svc.session.createSession(targetUser)
		const userDetail = await this.svc.user.getDetailById(targetUser.id)

		return { user: userDetail, token: session.token }
	}

	async verifyToken(token: string): Promise<UserDto> {
		const session = await this.svc.session.verifySession(token)
		if (!session) {
			throw err.invalidCredentials()
		}

		return this.svc.user.getDetailById(session.userId)
	}

	async getById(userId: number): Promise<UserDetailDto> {
		return this.svc.user.getDetailById(userId)
	}
}
