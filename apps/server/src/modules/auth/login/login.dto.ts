import { z } from 'zod'

import { UserDetailDto } from '@/modules/iam/user/user.dto'

import { zc, zp } from '@/lib/validation'

export const LoginDto = z.object({
	identifier: zc.strTrim.min(1),
	password: zc.password,
})
export type LoginDto = z.infer<typeof LoginDto>

export const AuthOutputDto = z.object({
	user: UserDetailDto,
	token: zp.str,
})
export type AuthOutputDto = z.infer<typeof AuthOutputDto>
