import { z } from 'zod'

import { zc, zp } from '@/shared/schema/index.ts'

// ─── Response ───

export const UserDto = z.object({
	id: zp.id,
	username: zp.str,
	email: zp.str,
	name: zp.str,
	isActive: zp.bool,
	...zc.AuditBasic.shape,
})
export type UserDto = z.infer<typeof UserDto>

// ─── Mutation Base ───

const UserMutationDto = z.object({
	username: zc.strTrim.min(3).max(100),
	email: z.email().max(255),
	name: zc.strTrim.min(1).max(255),
	isActive: z.boolean().default(true),
})

// ─── Create / Update ───

export const UserCreateDto = z.object({
	...UserMutationDto.shape,
	password: z.string().min(8).max(100),
})
export type UserCreateDto = z.infer<typeof UserCreateDto>

export const UserUpdateDto = z.object({
	id: zp.id,
	...UserMutationDto.shape,
})
export type UserUpdateDto = z.infer<typeof UserUpdateDto>

// ─── Reset Password ───

export const UserResetPasswordDto = z.object({
	id: zp.id,
	password: z.string().min(8).max(100),
})
export type UserResetPasswordDto = z.infer<typeof UserResetPasswordDto>
