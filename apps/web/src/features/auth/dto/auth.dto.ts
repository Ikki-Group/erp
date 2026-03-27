import z from 'zod'

import { UserOutputDto } from '@/features/iam'
import { zStr } from '@/lib/zod'

/* ---------------------------------- INPUT --------------------------------- */

export const LoginDto = z.object({ identifier: zStr, password: zStr })

export type LoginDto = z.infer<typeof LoginDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const AuthOutputDto = z.object({ user: UserOutputDto, token: zStr })

export type AuthOutputDto = z.infer<typeof AuthOutputDto>
