import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema/index.ts'

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

// ─── Filter ───

export const UserFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	isActive: z.coerce.number().int().min(0).max(1).optional(),
})
export type UserFilterDto = z.infer<typeof UserFilterDto>

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
	password: z.string().min(8).max(100).optional(),
})
export type UserUpdateDto = z.infer<typeof UserUpdateDto>
