import { z } from 'zod'

import { zp } from '@/lib/validation/index.ts'

// ─── Request DTOs ───

export const LoginDto = z.object({
	username: z.string().trim().min(1),
	password: z.string().min(1),
})
export type LoginDto = z.input<typeof LoginDto>

export const SwitchLocationDto = z.object({
	locationId: zp.id,
})
export type SwitchLocationDto = z.input<typeof SwitchLocationDto>

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
	user: AuthUserDto,
	locations: z.array(AuthLocationDto),
	activeLocationId: zp.id.nullable(),
})
export type LoginResponse = z.infer<typeof LoginResponseDto>

export const MeResponseDto = z.object({
	user: AuthUserDto,
	activeLocation: AuthLocationDto.nullable(),
	permissions: z.array(z.string()),
	isOwner: zp.bool,
})
export type MeResponse = z.infer<typeof MeResponseDto>

export const SwitchLocationResponseDto = z.object({
	activeLocation: AuthLocationDto,
})
export type SwitchLocationResponse = z.infer<typeof SwitchLocationResponseDto>
