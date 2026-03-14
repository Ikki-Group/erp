import z from 'zod'

import { UserOutputDto } from '@/modules/iam/dto'

import { zPrimitive } from '@/core/validation'

/* ---------------------------------- INPUT --------------------------------- */

export const LoginDto = z.object({
  identifier: zPrimitive.str,
  password: zPrimitive.str,
})

export type LoginDto = z.infer<typeof LoginDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const AuthOutputDto = z.object({
  user: UserOutputDto,
  token: zPrimitive.str,
})

export type AuthOutputDto = z.infer<typeof AuthOutputDto>
