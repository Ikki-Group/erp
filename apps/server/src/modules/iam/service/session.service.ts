import jwt from 'jsonwebtoken'

import { db, type DBTransaction } from '@/database'
import { userSessions } from '@/database/schema'

import { env } from '@/config/env'

import type { SessionDataDto, UserDto, UserSessionDto } from '../schema'

export class SessionService {
  async createSession(user: UserDto, tx?: DBTransaction): Promise<UserSessionDto> {
    const data: SessionDataDto = {
      userId: user.id,
      email: user.email,
      username: user.username,
    }

    const token = jwt.sign(data, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    })

    const session = await (tx || db).insert(userSessions).values({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + env.JWT_EXPIRES_IN),
    })

    return session
  }

  async deleteSession() {
    //
  }
}
