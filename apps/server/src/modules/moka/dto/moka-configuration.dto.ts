import { z } from 'zod'

import { zId, zDate, zEmail, zMetadataDto, zRecordIdDto } from '@/core/validation'

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

export const MokaConfigurationOutputDto = MokaConfigurationDto.omit({ password: true })
export type MokaConfigurationOutputDto = z.infer<typeof MokaConfigurationOutputDto>

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
