import z from 'zod'

import { zPrimitive } from '@/core/validation'
import { UserOutputDto } from '@/modules/iam/dto'

/* ---------------------------------- INPUT --------------------------------- */

export const LoginDto = z.object({ identifier: zPrimitive.str, password: zPrimitive.str })

export type LoginDto = z.infer<typeof LoginDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const AuthOutputDto = z.object({ user: UserOutputDto, token: zPrimitive.str })

export type AuthOutputDto = z.infer<typeof AuthOutputDto>
