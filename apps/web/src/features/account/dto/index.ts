import { z } from 'zod'

import { zp } from '@/lib/validation/index.ts'

// ─── Request DTOs ───

export const ProfileUpdateDto = z.object({
	name: z.string().trim().min(1).max(255),
	email: z.string().trim().email().max(255),
})
export type ProfileUpdateDto = z.infer<typeof ProfileUpdateDto>

export const PasswordChangeDto = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(8).max(100),
})
export type PasswordChangeDto = z.infer<typeof PasswordChangeDto>

export const SessionIdQueryDto = z.object({
	id: z.string().min(1),
})
export type SessionIdQueryDto = z.infer<typeof SessionIdQueryDto>

// ─── Response DTOs ───

export const PasswordChangeResultDto = z.object({
	revokedSessions: z.number().int().nonnegative(),
})
export type PasswordChangeResultDto = z.infer<typeof PasswordChangeResultDto>

export const RevokeOthersResultDto = z.object({
	revoked: z.number().int().nonnegative(),
})
export type RevokeOthersResultDto = z.infer<typeof RevokeOthersResultDto>

export const SessionDto = z.object({
	id: zp.str,
	userAgent: zp.strNullable,
	ipAddress: zp.strNullable,
	createdAt: zp.date,
	lastSeenAt: zp.date,
	expiresAt: zp.date,
	isCurrent: zp.bool,
})
export type SessionDto = z.infer<typeof SessionDto>
