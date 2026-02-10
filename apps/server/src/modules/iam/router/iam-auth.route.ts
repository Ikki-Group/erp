import { Elysia } from 'elysia'

import { authPlugin } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zResponse } from '@/lib/zod'

import { IamSchema } from '../iam.types'
import type { IamServiceModule } from '../service'

export function initIamAuthRoute(service: IamServiceModule) {
  return new Elysia()
    .post(
      '/login',
      async ({ body }) => {
        const { user, token } = await service.auth.login(body.identifier, body.password)
        return res.ok({ token, user }, 'AUTH_LOGIN_SUCCESS')
      },
      {
        body: IamSchema.LoginRequest,
        response: zResponse.ok(IamSchema.AuthResponse),
        detail: {
          summary: 'Login to get access token',
        },
      }
    )
    .use(authPlugin)
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
