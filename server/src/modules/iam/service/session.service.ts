import { record } from '@elysiajs/opentelemetry'
import { eq, lte } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

import { cache } from '@/lib/cache'
import { takeFirst } from '@/lib/db'
import { logger } from '@/lib/logger'

import { sessions } from '@/db/schema'

import { env } from '@/config/env'
import { db } from '@/db'

import { SessionDataDto, type SessionDto, type UserDto } from '../dto'

/* -------------------------------- CONSTANTS -------------------------------- */

const cacheKey = {
  byId: (id: number) => `session.byId.${id}`,
}

/* ----------------------------- IMPLEMENTATION ----------------------------- */

export class SessionService {
  /**
   * Finds a single session by its ID. Cached.
   */
  async findById(id: number): Promise<SessionDto | null> {
    return record('SessionService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        const result = await db.select().from(sessions).where(eq(sessions.id, id))
        return takeFirst(result)
      })
    })
  }

  /**
   * Creates a new session and returns the signed JWT token.
   */
  async createSession(user: UserDto): Promise<{ session: SessionDto; token: string }> {
    return record('SessionService.createSession', async () => {
      const createdAt = new Date()
      const expiredAt = new Date(createdAt.getTime() + env.JWT_EXPIRES_IN)

      const [session] = await db
        .insert(sessions)
        .values({
          userId: user.id,
          createdAt,
          expiredAt,
        })
        .returning()

      if (!session) throw new Error('Failed to create session')

      const data: SessionDataDto = {
        id: session.id,
        userId: user.id,
        email: user.email,
        username: user.username,
      }

      const token = jwt.sign(data, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
      })

      return { session: session as SessionDto, token }
    })
  }

  /**
   * Verifies a session's token and integrity.
   */
  async verifySession(token: string): Promise<SessionDto | null> {
    return record('SessionService.verifySession', async () => {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET)
        const valid = SessionDataDto.parse(decoded)
        const session = await this.findById(valid.id)

        if (!session) return null

        // If session expired, delete it and return null
        if (session.expiredAt < new Date()) {
          await this.deleteSession(session.id)
          return null
        }

        return session
      } catch (error) {
        logger.error(error, 'Failed to verify session')
        return null
      }
    })
  }

  /**
   * Explicitly deletes a session. Invalidates cache.
   */
  async deleteSession(id: number): Promise<void> {
    return record('SessionService.deleteSession', async () => {
      await db.delete(sessions).where(eq(sessions.id, id))
      void cache.del(cacheKey.byId(id))
    })
  }

  /**
   * Cleanup expired sessions from the database.
   */
  async cleanupExpired(): Promise<void> {
    return record('SessionService.cleanupExpired', async () => {
      await db.delete(sessions).where(lte(sessions.expiredAt, new Date()))
    })
  }
}
