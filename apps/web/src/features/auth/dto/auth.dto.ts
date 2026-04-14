import z from 'zod'

import { UserSelectDto } from '@/features/iam'
import { zStr } from '@/lib/zod'

export const LoginDto = z.object({ identifier: zStr, password: zStr })

export type LoginDto = z.infer<typeof LoginDto>

export const AuthSelectDto = z.object({ user: UserSelectDto, token: zStr })

export type AuthSelectDto = z.infer<typeof AuthSelectDto>
