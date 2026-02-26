import z from 'zod'

import { UserDetailDto } from './user.schema'

export const LoginDto = z.object({
  identifier: z.string().describe('Email or Username'),
  password: z.string(),
})

export type LoginDto = z.infer<typeof LoginDto>

export const AuthResponseDto = z.object({
  token: z.string(),
  user: UserDetailDto,
})

export type AuthResponseDto = z.infer<typeof AuthResponseDto>
