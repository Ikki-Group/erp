import { endpoint } from '@/config/endpoint'
import { UserOutputDto } from '@/features/iam'
import { apiFactory } from '@/lib/api'
import { zHttp } from '@/lib/zod'

import { AuthOutputDto, LoginDto } from '../dto'

export const authApi = {
  login: apiFactory({ method: 'post', url: endpoint.auth.login, body: LoginDto, result: zHttp.ok(AuthOutputDto) }),
  me: apiFactory({ method: 'get', url: endpoint.auth.me, result: zHttp.ok(UserOutputDto) }),
}
