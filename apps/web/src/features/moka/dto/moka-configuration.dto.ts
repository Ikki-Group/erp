import { z } from 'zod'

import { zp, zc } from '@/lib/validation'

export const MokaConfigurationDto = z.object({
	...zc.RecordId.shape,
	locationId: zp.id,
	email: zc.email,
	password: z.string(),
	businessId: z.string().nullable(),
	outletId: z.string().nullable(),
	accessToken: z.string().nullable(),
	lastSyncedAt: zp.date.nullable(),
	...zc.AuditFull.shape,
})
export type MokaConfigurationDto = z.infer<typeof MokaConfigurationDto>

export const MokaConfigurationSelectDto = MokaConfigurationDto.omit({ password: true })
export type MokaConfigurationSelectDto = z.infer<typeof MokaConfigurationSelectDto>

export const MokaConfigurationCreateDto = z.object({
	locationId: zp.id,
	email: zc.email,
	password: z.string().min(6),
})
export type MokaConfigurationCreateDto = z.infer<typeof MokaConfigurationCreateDto>

export const MokaConfigurationUpdateDto = z.object({
	...MokaConfigurationCreateDto.partial().shape,
	locationId: zp.id.optional(),
})
export type MokaConfigurationUpdateDto = z.infer<typeof MokaConfigurationUpdateDto>
