import { z } from 'zod'

import { zp } from '@/lib/validation'

export const SessionDto = z.object({
	id: zp.id,
	userId: zp.id,
	createdAt: zp.date,
	expiredAt: zp.date,
})
export type SessionDto = z.infer<typeof SessionDto>

export const SessionPayloadDto = z.object({
	id: zp.id,
	userId: zp.id,
	email: zp.str,
	username: zp.str,
})
export type SessionPayloadDto = z.infer<typeof SessionPayloadDto>
