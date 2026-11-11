import { z } from 'zod'

import { zp } from '@/lib/validation/index.ts'

import { UserDetailDto } from '@/features/iam/dto/index.ts'

// ─── Request DTOs ───

export const LoginDto = z.object({
	username: z.string().trim().min(1),
	password: z.string().trim().min(1),
})
export type LoginDto = z.input<typeof LoginDto>

// ─── Response DTOs ───

const AuthUserDto = z.object({
	id: zp.id,
	username: zp.str,
	name: zp.str,
	email: zp.str,
})
export type AuthUser = z.infer<typeof AuthUserDto>

const AuthLocationDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: zp.str,
})
export type AuthLocation = z.infer<typeof AuthLocationDto>

export const LoginResponseDto = z.object({
	token: zp.str,
	user: AuthUserDto,
	locations: z.array(AuthLocationDto),
})
export type LoginResponse = z.infer<typeof LoginResponseDto>

export const MeResponseDto = z.object({
	user: UserDetailDto,
	locations: z.array(AuthLocationDto),
	permissions: z.array(z.string()),
	globalPermissions: z.array(z.string()),
	access: z.record(z.string(), z.array(z.string())),
	isOwner: zp.bool,
})
export type MeResponse = z.infer<typeof MeResponseDto>
