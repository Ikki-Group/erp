import { Elysia } from 'elysia'
import z from 'zod'

import { authPlugin } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zResponse } from '@/lib/zod'

import { IamSchema } from '../iam.schema'
import type { IamServiceModule } from '../service'

const LoginReq = z
  .object({
    identifier: z.string().describe('Email or Username'),
    password: z.string(),
  })
  .meta({
    example: {
      identifier: 'test@test.com',
      password: '123456',
    },
  })

export function initIamAuthRoute(service: IamServiceModule) {
  return new Elysia()
    .use(authPlugin)
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
