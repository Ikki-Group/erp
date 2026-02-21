import { Elysia } from 'elysia'

import { res } from '@/lib/utils/response.util'
import { zResponse } from '@/lib/validation'

import { AuthResponseDto, LoginDto } from '../schema'
import type { IamServiceModule } from '../service'

export function initAuthRoute(service: IamServiceModule) {
  return new Elysia().post(
    '/login',
    async ({ body }) => {
      const { user, token } = await service.auth.login(body)
      return res.ok({ token, user }, 'AUTH_LOGIN_SUCCESS')
    },
    {
      body: LoginDto,
      response: zResponse.ok(AuthResponseDto),
    }
  )
}
