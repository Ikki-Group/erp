import z from 'zod'
import { UserSelectDto } from './user.dto'
import { zPrimitive } from '@/lib/zod'

export const LoginDto = z.object({
  identifier: zPrimitive.str,
  password: zPrimitive.str,
})

export type LoginDto = z.infer<typeof LoginDto>

export const AuthResponseDto = z.object({
  user: UserSelectDto,
  token: zPrimitive.str,
})

export type AuthResponseDto = z.infer<typeof AuthResponseDto>
