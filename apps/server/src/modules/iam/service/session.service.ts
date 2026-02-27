import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import { logger } from '@/lib/logger'

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

    const [session] = await (tx || db)
      .insert(userSessions)
      .values({
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + env.JWT_EXPIRES_IN),
      })
      .returning()

    if (!session) {
      throw new Error('Failed to create session')
    }

    return session
  }

  async verifySession(token: string): Promise<UserSessionDto | null> {
    try {
      const valid = jwt.verify(token, env.JWT_SECRET) as SessionDataDto
      const [session] = await db.select().from(userSessions).where(eq(userSessions.token, token)).limit(1).execute()

      if (!session) {
        return null
      }

      if (session.expiresAt < new Date()) {
        await this.deleteSession(session.token)
        return null
      }

      return session
    } catch (error) {
      logger.withError(error).error('Failed to verify session')
      return null
    }
  }

  async deleteSession(token: string) {
    await db.delete(userSessions).where(eq(userSessions.token, token)).execute()
  }
}
