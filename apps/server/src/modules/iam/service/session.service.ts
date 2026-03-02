import { record } from '@elysiajs/opentelemetry'
import jwt from 'jsonwebtoken'

import { cache } from '@/lib/cache'
import { logger } from '@/lib/logger'

import { env } from '@/config/env'

import { SessionDataDto, type SessionDto, type UserDto } from '../dto'
import { SessionModel } from '../model'

const cacheKey = {
  byId: (id: ObjectId) => `session.byId.${id}`,
}

export class SessionService {
  async findById(id: ObjectId): Promise<SessionDto | null> {
    return record('SessionService.findById', async () => {
      return cache.wrap(cacheKey.byId(id), async () => {
        return SessionModel.findById(id)
      })
    })
  }

  async createSession(user: UserDto): Promise<{ session: SessionDto; token: string }> {
    return record('SessionService.createSession', async () => {
      const createdAt = new Date()
      const expiredAt = new Date(createdAt.getTime() + env.JWT_EXPIRES_IN)

      const session = new SessionModel({
        userId: user.id,
        createdAt,
        expiredAt,
      })

      const data: SessionDataDto = {
        id: session._id,
        userId: user.id,
        email: user.email,
        username: user.username,
      }

      const token = jwt.sign(data, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
      })

      await session.save()
      return { session, token }
    })
  }

  async verifySession(token: string): Promise<SessionDto | null> {
    return record('SessionService.verifySession', async () => {
      try {
        const valid = SessionDataDto.parse(jwt.verify(token, env.JWT_SECRET))
        const session = await this.findById(valid.id)

        if (!session) return null

        if (session.expiredAt < new Date()) {
          await this.deleteSession(session.id)
          return null
        }

        return session
      } catch (error) {
        logger.withError(error).error('Failed to verify session')
        return null
      }
    })
  }

  async deleteSession(id: ObjectId) {
    return record('SessionService.deleteSession', async () => {
      await SessionModel.findByIdAndDelete(id)
      void cache.del(cacheKey.byId(id))
    })
  }
}
