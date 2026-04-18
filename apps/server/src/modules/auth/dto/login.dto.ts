import { z } from 'zod'

import { zc, zp } from '@/core/validation'

import { UserDto } from '@/modules/iam/dto/user.dto'

export const LoginDto = z.object({
	identifier: zc.strTrim.min(1),
	password: zc.password,
})
export type LoginDto = z.infer<typeof LoginDto>

export const AuthOutputDto = z.object({
	user: UserDto,
	token: zp.str,
})
export type AuthOutputDto = z.infer<typeof AuthOutputDto>
