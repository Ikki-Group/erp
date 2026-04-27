import { z } from 'zod'

import { zc, zp } from '@/lib/validation'

import { UserDetailDto } from '@/features/iam'

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
