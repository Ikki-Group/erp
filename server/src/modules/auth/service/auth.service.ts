import type { UserOutputDto } from '@/modules/iam/dto'
import type { UserService } from '@/modules/iam/service/user.service'

import { UnauthorizedError } from '@/core/http/errors'
import { verifyPassword } from '@/core/password'

import type { AuthOutputDto, LoginDto } from '@/modules/auth/dto'

import type { SessionService } from './session.service'

export class AuthService {
  constructor(
    private readonly userSvc: UserService,
    private readonly sessionSvc: SessionService
  ) {}

  async login(input: LoginDto): Promise<AuthOutputDto> {
    const { identifier, password } = input
    const targetUser = await this.userSvc.findByIdentifier(identifier)

    if (!targetUser || !targetUser.isActive) {
      throw new UnauthorizedError('User not found', 'AUTH_USER_NOT_FOUND')
    }

    const isPasswordValid = await verifyPassword(password, targetUser.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
    }

    const session = await this.sessionSvc.createSession(targetUser)
    const userDetail = await this.userSvc.getDetailById(targetUser.id)

    return {
      user: userDetail,
      token: session.token,
    }
  }

  async verifyToken(token: string): Promise<UserOutputDto> {
    const session = await this.sessionSvc.verifySession(token)
    if (!session) {
      throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
    }

    const userWithAccess = await this.userSvc.getDetailById(session.userId)
    return userWithAccess
  }
}
