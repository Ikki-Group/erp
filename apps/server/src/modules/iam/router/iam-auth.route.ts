import { authPlugin } from '@server/lib/elysia/auth-plugin'
import { res } from '@server/lib/utils/response.util'
import { zResponse } from '@server/lib/zod'
import { Elysia } from 'elysia'

import { IamSchema } from '../iam.types'
import type { IamService } from '../service'

export function buildIamAuthRoute(service: IamService) {
  return new Elysia({ prefix: '/auth', tags: ['IAM'] })
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
