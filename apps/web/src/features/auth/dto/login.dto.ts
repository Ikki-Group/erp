import z from 'zod'

import { zStr } from '@/lib/zod'

import { UserSelectDto } from '@/features/iam'

export const LoginDto = z.object({ identifier: zStr, password: zStr })

export type LoginDto = z.infer<typeof LoginDto>

export const AuthSelectDto = z.object({ user: UserSelectDto, token: zStr })

export type AuthSelectDto = z.infer<typeof AuthSelectDto>
