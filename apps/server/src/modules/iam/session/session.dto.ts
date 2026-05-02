import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const SessionDto = z.object({
	...zc.RecordId.shape,
	userId: zp.id,
	createdAt: zp.date,
	expiredAt: zp.date,
})
export type SessionDto = z.infer<typeof SessionDto>

export const SessionSelectDto = SessionDto.extend({
	userEmail: zp.str.optional(),
	userUsername: zp.str.optional(),
	userFullname: zp.str.optional(),
})
export type SessionSelectDto = z.infer<typeof SessionSelectDto>

/* --------------------------------- FILTER --------------------------------- */

export const SessionFilterDto = z.object({
	...zq.pagination.shape,
	userId: zq.id.optional(),
	isActive: zq.bool.optional(),
})
export type SessionFilterDto = z.infer<typeof SessionFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const SessionInvalidateDto = z.object({
	sessionIds: z.array(zp.id).min(1),
})
export type SessionInvalidateDto = z.infer<typeof SessionInvalidateDto>

export const SessionInvalidateAllDto = z.object({
	userId: zp.id,
	exceptCurrentSessionId: zp.id.optional(),
})
export type SessionInvalidateAllDto = z.infer<typeof SessionInvalidateAllDto>

export const SessionInvalidateExpiredDto = z.object({})
export type SessionInvalidateExpiredDto = z.infer<typeof SessionInvalidateExpiredDto>
