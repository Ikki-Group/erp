import z from 'zod'

import { z, zp, zc } from '@ikki/api-contract/validation'

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
	email: zc.email,
	username: zp.str,
})

export type SessionPayloadDto = z.infer<typeof SessionPayloadDto>
