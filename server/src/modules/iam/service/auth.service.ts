import { UnauthorizedError } from '@/lib/error/http'
import { verifyPassword } from '@/lib/password'

import type { AuthResponseDto, LoginDto, UserSelectDto } from '../dto'

import type { SessionService } from './session.service'
import type { UserService } from './user.service'

export class AuthService {
  constructor(
    private readonly userSvc: UserService,
    private readonly sessionSvc: SessionService
  ) {}

  async login(input: LoginDto): Promise<AuthResponseDto> {
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

  async verifyToken(token: string): Promise<UserSelectDto> {
    const session = await this.sessionSvc.verifySession(token)
    if (!session) {
      throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
    }

    const userWithAccess = await this.userSvc.getDetailById(session.userId)
    return userWithAccess
  }
}
