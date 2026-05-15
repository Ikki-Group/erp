import { z, zc, zp } from '@ikki/api-contract/validation'

export const SessionSchema = z.object({
	...zc.RecordId.shape,
	userId: zp.id,
	createdAt: zp.date,
	expiredAt: zp.date,
})
export type SessionSchema = z.infer<typeof SessionSchema>

export const SessionPayloadSchema = z.object({
	id: zp.id,
	userId: zp.id,
	email: zp.str,
	username: zp.str,
})
export type SessionPayloadSchema = z.infer<typeof SessionPayloadSchema>
