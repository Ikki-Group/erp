import { endpoint } from '@/config/endpoint'
import { UserSelectDto } from '@/features/iam'
import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/zod'

import { AuthSelectDto, LoginDto } from '../dto'

export const authApi = {
  login: apiFactory({ method: 'post', url: endpoint.auth.login, body: LoginDto, result: createSuccessResponseSchema(AuthSelectDto) }),
  me: apiFactory({ method: 'get', url: endpoint.auth.me, result: createSuccessResponseSchema(UserSelectDto) }),
}
