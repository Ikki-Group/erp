import z from 'zod'

import { defineContract, dto, endpoint } from '@/shared/contract/define-contract'
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
	prefix: '/location',
	dtoSource: 'auth/auth.contract.ts',
	endpoints: [
		endpoint({
			action: 'login',
			method: 'post',
			path: '/login',
			input: { kind: 'body', ref: dto(AuthLoginDto, 'AuthLoginDto') },
			output: { kind: 'single', ref: dto(AuthOutputDto, 'AuthOutputDto') },
		}),
		endpoint({
			action: 'me',
			method: 'get',
			path: '/me',
			output: { kind: 'single', ref: dto(UserDto, 'UserDto') },
		}),
	],
})
