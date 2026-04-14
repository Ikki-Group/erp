import z from 'zod'

import { zStr } from '@/core/validation'
import { UserDto } from '@/modules/iam/dto'

export const LoginDto = z.object({ identifier: zStr, password: zStr })

export type LoginDto = z.infer<typeof LoginDto>

export const AuthOutputDto = z.object({ user: UserDto, token: zStr })

export type AuthOutputDto = z.infer<typeof AuthOutputDto>
