import { z } from 'zod'

import { zId, zDate, zEmail, zMetadataSchema, zRecordIdSchema } from '@/core/validation'

export const MokaConfigurationDto = z.object({
  ...zRecordIdSchema.shape,
  locationId: zId,
  email: zEmail,
  password: z.string(),
  businessId: z.number().nullable(),
  outletId: z.number().nullable(),
  accessToken: z.string().nullable(),
  lastSyncedAt: zDate.nullable(),
  ...zMetadataSchema.shape,
})
export type MokaConfigurationDto = z.infer<typeof MokaConfigurationDto>

export const MokaConfigurationOutputDto = MokaConfigurationDto.omit({ password: true })
export type MokaConfigurationOutputDto = z.infer<typeof MokaConfigurationOutputDto>

export const MokaConfigurationCreateDto = z.object({
  locationId: zId,
  email: zEmail,
  password: z.string().min(6),
})
export type MokaConfigurationCreateDto = z.infer<typeof MokaConfigurationCreateDto>

export const MokaConfigurationUpdateDto = MokaConfigurationCreateDto.partial().extend({
  locationId: zId.optional(),
})
export type MokaConfigurationUpdateDto = z.infer<typeof MokaConfigurationUpdateDto>
