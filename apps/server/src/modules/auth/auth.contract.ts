import { z } from 'zod'

import { zc, zp } from '@/shared/schema'

import { UserDetailDto } from '@/modules/iam'

// ─── Request DTOs ───

export const LoginDto = z.object({
	username: zc.strTrim,
	password: zc.strTrim,
})
export type LoginDto = z.infer<typeof LoginDto>

/** OAuth2 resource-owner password grant (RFC 6749 §4.3), form-encoded. */
export const TokenRequestDto = z.object({
	grant_type: z.literal('password'),
	...LoginDto.shape,
})

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
	token: zp.str,
	user: LoginUserDto,
	locations: z.array(LoginLocationDto),
})
export type LoginResponseDto = z.infer<typeof LoginResponseDto>

/** OAuth2 token response; `access_token` is the same session token `/auth/login` returns. */
export const TokenResponseDto = z.object({
	access_token: zp.str,
	token_type: z.literal('Bearer'),
	expires_in: z.number().int(),
})

export const MeResponseDto = z.object({
	user: UserDetailDto,
	locations: z.array(LoginLocationDto),
	permissions: z.array(z.string()),
	globalPermissions: z.array(z.string()),
	access: z.record(z.string(), z.array(z.string())),
	isOwner: zp.bool,
})
export type MeResponseDto = z.infer<typeof MeResponseDto>

// ─── Self-service ───

export const PasswordChangeResultDto = z.object({
	revokedSessions: z.number().int(),
})
export type PasswordChangeResultDto = z.infer<typeof PasswordChangeResultDto>
