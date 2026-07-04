import z from 'zod'

import { defineContract } from '@/shared/contract/define-contract'
import { zc, zp } from '@/shared/schema'

import { UserDto } from '@/modules/iam'

export const AuthLoginDto = z.object({
	identifier: zc.strTrim.min(1),
	password: zc.password,
})
export type AuthLoginDto = z.infer<typeof AuthLoginDto>

export const AuthOutputDto = z.object({
	user: UserDto,
	token: zp.str,
})
export type AuthOutputDto = z.infer<typeof AuthOutputDto>

/* -------------------------------- CONTRACT -------------------------------- */

export const authContract = defineContract({
	feature: 'auth',
	entity: 'auth',
	prefix: '/auth',
	dtoSource: 'auth/auth.contract.ts',
	dtos: { AuthLoginDto, AuthOutputDto, UserDto },
	endpoints: {
		login: { post: '/login', body: AuthLoginDto, ok: AuthOutputDto },
		me: { get: '/me', ok: UserDto },
	},
})
