import z from 'zod'

import { zPrimitive } from '@/lib/validation'

import { UserDetailDto } from '@/modules/iam/dto/user.dto'

export const LoginDto = z.object({
  identifier: zPrimitive.str,
  password: zPrimitive.str,
})

export type LoginDto = z.infer<typeof LoginDto>

export const AuthResponseDto = z.object({
  user: UserDetailDto,
  token: zPrimitive.str,
})

export type AuthResponseDto = z.infer<typeof AuthResponseDto>
