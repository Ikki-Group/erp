import { z } from 'zod'

import { zc, zp } from '@/core/validation'

/* ---------------------------------- ENTITY ---------------------------------- */

export const MokaConfigurationDto = z.object({
	...zc.RecordId.shape,
	locationId: zp.id,
	provider: z.literal('moka'),
	email: zp.str,
	password: zp.str,
	businessId: zp.str.nullable(),
	outletId: zp.str.nullable(),
	accessToken: zp.str.nullable(),
	isActive: z.boolean(),
	salesCronEnabled: z.boolean(),
	salesCronExpression: zp.str.nullable(),
	lastSyncedAt: zp.date.nullable(),
	lastSalesSyncedAt: zp.date.nullable(),
	lastProductSyncedAt: zp.date.nullable(),
	lastCategorySyncedAt: zp.date.nullable(),
	...zc.AuditBasic.shape,
})
export type MokaConfigurationDto = z.infer<typeof MokaConfigurationDto>

/* ---------------------------------- OUTPUT ---------------------------------- */

export const MokaConfigurationOutputDto = MokaConfigurationDto.omit({ password: true })
export type MokaConfigurationOutputDto = z.infer<typeof MokaConfigurationOutputDto>

/* -------------------------------- MUTATION -------------------------------- */

const MokaConfigurationMutationDto = z.object({
	locationId: zp.id,
	email: zc.email,
	password: zc.password,
	businessId: zc.strTrimNullable,
	outletId: zc.strTrimNullable,
	isActive: z.boolean().optional(),
	salesCronEnabled: z.boolean().optional(),
	salesCronExpression: zc.strTrimNullable,
})

export const MokaConfigurationCreateDto = MokaConfigurationMutationDto
export type MokaConfigurationCreateDto = z.infer<typeof MokaConfigurationCreateDto>

export const MokaConfigurationUpdateDto = MokaConfigurationMutationDto.partial().extend({
	...zc.RecordId.shape,
})
export type MokaConfigurationUpdateDto = z.infer<typeof MokaConfigurationUpdateDto>
