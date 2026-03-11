import { AuthOutputDto, LoginDto } from '../dto'
import { UserOutputDto } from '@/features/iam'
import { apiFactory } from '@/lib/api'
import { zHttp } from '@/lib/zod'

export const authApi = {
  login: apiFactory({
    method: 'post',
    url: 'iam/auth/login',
    body: LoginDto,
    result: zHttp.ok(AuthOutputDto),
  }),
  me: apiFactory({
    method: 'get',
    url: 'iam/auth/me',
    result: zHttp.ok(UserOutputDto),
  }),
}
