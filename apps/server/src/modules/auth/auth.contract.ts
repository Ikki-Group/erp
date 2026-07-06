import z from 'zod'

import { zc, zp } from '@/shared/schema'

import { UserDetailDto } from '@/modules/iam'

export const AuthLoginDto = z.object({
	identifier: zc.strTrim.min(1),
	password: zc.password,
})
export type AuthLoginDto = z.infer<typeof AuthLoginDto>

export const AuthOutputDto = z.object({
	user: UserDetailDto,
	token: zp.str,
})
export type AuthOutputDto = z.infer<typeof AuthOutputDto>

