import { z } from 'zod'

import { zp } from '@/shared/schema/index.ts'

// ─── Response ───

export const SessionDto = z.object({
	id: zp.str,
	userAgent: zp.str.nullable(),
	ipAddress: zp.str.nullable(),
	createdAt: zp.date,
	lastSeenAt: zp.date,
	expiresAt: zp.date,
	isCurrent: zp.bool,
})
export type SessionDto = z.infer<typeof SessionDto>

export const RevokeSessionResultDto = z.object({
	revoked: z.number().int().nonnegative(),
})
export type RevokeSessionResultDto = z.infer<typeof RevokeSessionResultDto>

// ─── Query ───

export const SessionIdQueryDto = z.object({
	id: z.string().trim().min(1),
})
export type SessionIdQueryDto = z.infer<typeof SessionIdQueryDto>
