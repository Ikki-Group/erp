import z from 'zod'

import { zc, zp } from '@/shared/schema'

import { UserDto } from '@/modules/iam'

export const AuthLoginSchema = z.object({
	identifier: zc.strTrim.min(1),
	password: zc.password,
})
export type AuthLoginSchema = z.infer<typeof AuthLoginSchema>

export const AuthOutputSchema = z.object({
	user: UserDto,
	token: zp.str,
})
export type AuthOutputSchema = z.infer<typeof AuthOutputSchema>
