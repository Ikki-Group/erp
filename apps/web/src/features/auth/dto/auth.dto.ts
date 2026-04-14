import z from 'zod'

import { UserSelectDto } from '@/features/iam'
import { zStr } from '@/lib/zod'

/* ---------------------------------- INPUT --------------------------------- */

export const LoginDto = z.object({ identifier: zStr, password: zStr })

export type LoginDto = z.infer<typeof LoginDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const AuthSelectDto = z.object({ user: UserSelectDto, token: zStr })

export type AuthSelectDto = z.infer<typeof AuthSelectDto>
