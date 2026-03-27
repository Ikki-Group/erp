import { endpoint } from '@/config/endpoint'
import { UserOutputDto } from '@/features/iam'
import { apiFactory } from '@/lib/api'
import { createSuccessResponseSchema } from '@/lib/zod'

import { AuthOutputDto, LoginDto } from '../dto'

export const authApi = {
  login: apiFactory({ method: 'post', url: endpoint.auth.login, body: LoginDto, result: createSuccessResponseSchema(AuthOutputDto) }),
  me: apiFactory({ method: 'get', url: endpoint.auth.me, result: createSuccessResponseSchema(UserOutputDto) }),
}
