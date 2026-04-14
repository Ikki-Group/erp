import { Elysia } from 'elysia'

import { authPluginMacro } from '@/core/http/auth-macro'
import { res } from '@/core/http/response'
import { createSuccessResponseSchema } from '@/core/validation'
import { UserDto } from '@/modules/iam/dto'

import { AuthOutputDto, LoginDto } from '../dto'
import type { AuthService } from '../service/auth.service'

export function initAuthRoute(svc: AuthService) {
  return new Elysia({ prefix: '/auth' })
    .use(authPluginMacro)
    .post(
      '/login',
      async function login({ body }) {
        const { user, token } = await svc.login(body)
        return res.ok({ token, user }, 'AUTH_LOGIN_SUCCESS')
      },
      { body: LoginDto, response: createSuccessResponseSchema(AuthOutputDto) },
    )
    .get(
      '/me',
      async function me({ auth }) {
        const userWithDetails = await svc.getById(auth.user!.id)
        return res.ok(userWithDetails, 'AUTH_ME_SUCCESS')
      },
      { response: createSuccessResponseSchema(UserDto), auth: true },
    )
}
