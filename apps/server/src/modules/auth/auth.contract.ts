import { z } from 'zod'

import { zc, zp } from '@/shared/schema/index.ts'

// ─── Request DTOs ───

export const LoginDto = z.object({
	username: zc.strTrim,
	password: zc.strTrim,
})
export type LoginDto = z.infer<typeof LoginDto>

export const SwitchLocationDto = z.object({
	locationId: zp.id,
})
export type SwitchLocationDto = z.infer<typeof SwitchLocationDto>

// ─── Response DTOs ───

const LoginUserDto = z.object({
	id: zp.id,
	username: zp.str,
	name: zp.str,
	email: zp.str,
})
type LoginUserDto = z.infer<typeof LoginUserDto>

const LoginLocationDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: zp.str,
})
type LoginLocationDto = z.infer<typeof LoginLocationDto>

export const LoginResponseDto = z.object({
	user: LoginUserDto,
	locations: z.array(LoginLocationDto),
	activeLocationId: zp.id.nullable(),
})
export type LoginResponseDto = z.infer<typeof LoginResponseDto>

export const MeResponseDto = z.object({
	user: LoginUserDto,
	activeLocation: LoginLocationDto.nullable(),
	permissions: z.array(z.string()),
	isOwner: zp.bool,
})
export type MeResponseDto = z.infer<typeof MeResponseDto>

export const SwitchLocationResponseDto = z.object({
	activeLocation: LoginLocationDto,
})
export type SwitchLocationResponseDto = z.infer<typeof SwitchLocationResponseDto>
