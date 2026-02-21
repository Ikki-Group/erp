import { Elysia } from 'elysia'
import z from 'zod'

import { res } from '@/lib/utils/response.util'
import { zResponse } from '@/lib/validation'

import type { users } from '@/database/schema'

import { IamSchema } from '../iam.schema'
import type { IamServiceModule } from '../service'

const LoginReq = z
  .object({
    identifier: z.string().describe('Email or Username'),
    password: z.string(),
  })
  .meta({
    example: {
      identifier: 'admin@ikki.dev',
      password: 'admin123',
    },
  })

export function initIamAuthRoute(service: IamServiceModule) {
  return new Elysia()
    .decorate('user', null as typeof users.$inferSelect | null)
    .post(
      '/login',
      async ({ body }) => {
        const { user, token } = await service.auth.login(body.identifier, body.password)
        return res.ok({ token, user }, 'AUTH_LOGIN_SUCCESS')
      },
      {
        body: LoginReq,
        response: zResponse.ok(IamSchema.AuthResponse),
      }
    )
    .get(
      '/me',
      async ({ user }) => {
        const userDetails = await service.auth.getUserDetails(user!.id)
        return res.ok(userDetails)
      },
      {
        isAuth: true,
        response: zResponse.ok(IamSchema.UserWithAccess),
        detail: {
          summary: 'Get current user information with permissions and locations',
        },
      }
    )
}
