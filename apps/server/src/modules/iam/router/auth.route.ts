import { Elysia } from 'elysia'

import { authPluginMacro } from '@/lib/elysia/auth-plugin'
import { res } from '@/lib/utils/response.util'
import { zResponse } from '@/lib/validation'

import { AuthResponseDto, LoginDto, UserDetailDto } from '../schema'
import type { IamServiceModule } from '../service'

export function initAuthRoute(service: IamServiceModule) {
  return new Elysia()
    .use(authPluginMacro)
    .post(
      '/login',
      async function login({ body }) {
        const { user, token } = await service.auth.login(body)
        return res.ok({ token, user }, 'AUTH_LOGIN_SUCCESS')
      },
      {
        body: LoginDto,
        response: zResponse.ok(AuthResponseDto),
      }
    )
    .get(
      '/me',
      async function me({ auth }) {
        return res.ok(auth.user!, 'AUTH_ME_SUCCESS')
      },
      {
        isAuthenticated: true,
        response: zResponse.ok(UserDetailDto),
      }
    )
}
