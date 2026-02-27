import { z } from 'zod'
import { UserDetailDto } from '@/features/iam/dto'
import { AuthResponseDto } from '@/features/iam/dto/auth.dto'
import { apiFactory } from '@/lib/api'
import { zHttp } from '@/lib/zod'

export const authApi = {
  login: apiFactory({
    method: 'post',
    url: 'iam/auth/login',
    body: z.object({
      identifier: z.string(),
      password: z.string(),
    }),
    result: zHttp.ok(AuthResponseDto),
  }),
  me: apiFactory({
    method: 'get',
    url: 'iam/auth/me',
    result: zHttp.ok(UserDetailDto),
  }),
}
