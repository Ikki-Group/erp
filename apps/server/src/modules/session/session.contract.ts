import z from 'zod'

import { zc, zp } from '@/shared/schema'

export const SessionDto = z.object({
	...zc.RecordId.shape,
	userId: zp.id,
	locationId: zp.id,
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
