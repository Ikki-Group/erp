import { eq } from 'drizzle-orm'

import { UnauthorizedError } from '@/lib/error/http'
import { verifyPassword } from '@/lib/utils/password.util'

import { db } from '@/database'
import { users } from '@/database/schema'

import type { AuthResponseDto, LoginDto } from '../schema'

import type { SessionService } from './session.service'
import type { UserService } from './user.service'

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService
  ) {}

  async findUserByIdentifier(identifier: string): Promise<typeof users.$inferSelect | null> {
    const [user] = await db.select().from(users).where(eq(users.email, identifier.toLowerCase())).limit(1).execute()

    if (user) return user

    const [userByUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, identifier.toLowerCase()))
      .limit(1)
      .execute()

    return userByUsername ?? null
  }

  async login(input: LoginDto): Promise<AuthResponseDto> {
    const { identifier, password } = input
    const targetUser = await this.findUserByIdentifier(identifier)

    if (!targetUser || !targetUser.isActive) {
      throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
    }

    const isPasswordValid = await verifyPassword(password, targetUser.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials', 'AUTH_INVALID_CREDENTIALS')
    }

    const [session, userWithAccess] = await db.transaction(async (tx) => {
      const session = await this.sessionService.createSession(targetUser, tx)
      const userWithAccess = await this.userService.findDetailById(targetUser.id)

      return [session, userWithAccess]
    })

    return {
      user: userWithAccess,
      token: session.token,
    }
  }
}
