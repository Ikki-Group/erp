import { Elysia } from 'elysia'

import { res } from '@/lib/utils/response.util'
import { zResponse } from '@/lib/validation'

import { AuthResponseDto, LoginDto, UserWithAccessDto } from '../schema'
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
        body: LoginDto,
        response: zResponse.ok(AuthResponseDto),
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
        response: zResponse.ok(UserWithAccessDto),
        detail: {
          summary: 'Get current user information with permissions and locations',
        },
      }
    )
}
