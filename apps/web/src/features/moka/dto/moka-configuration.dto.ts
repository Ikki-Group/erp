import { z } from 'zod'

import { zDate, zEmail, zId, zMetadataDto, zRecordIdDto } from '@/lib/zod'

export const MokaConfigurationDto = z.object({
	...zRecordIdDto.shape,
	locationId: zId,
	email: zEmail,
	password: z.string(),
	businessId: z.string().nullable(),
	outletId: z.string().nullable(),
	accessToken: z.string().nullable(),
	lastSyncedAt: zDate.nullable(),
	...zMetadataDto.shape,
})
export type MokaConfigurationDto = z.infer<typeof MokaConfigurationDto>

export const MokaConfigurationSelectDto = MokaConfigurationDto.omit({ password: true })
export type MokaConfigurationSelectDto = z.infer<typeof MokaConfigurationSelectDto>

export const MokaConfigurationCreateDto = z.object({
	locationId: zId,
	email: zEmail,
	password: z.string().min(6),
})
export type MokaConfigurationCreateDto = z.infer<typeof MokaConfigurationCreateDto>

export const MokaConfigurationUpdateDto = z.object({
	...MokaConfigurationCreateDto.partial().shape,
	locationId: zId.optional(),
})
export type MokaConfigurationUpdateDto = z.infer<typeof MokaConfigurationUpdateDto>
