import { z } from 'zod'

import { zPrimitive, zSchema } from '@/core/validation'

export const MokaConfigurationDto = z.object({
  ...zSchema.recordId.shape,
  locationId: zPrimitive.id,
  email: zPrimitive.email,
  password: z.string(),
  businessId: z.number().nullable(),
  outletId: z.number().nullable(),
  accessToken: z.string().nullable(),
  lastSyncedAt: zPrimitive.date.nullable(),
  ...zSchema.metadata.shape,
})
export type MokaConfigurationDto = z.infer<typeof MokaConfigurationDto>

export const MokaConfigurationOutputDto = MokaConfigurationDto.omit({ password: true })
export type MokaConfigurationOutputDto = z.infer<typeof MokaConfigurationOutputDto>

export const MokaConfigurationCreateDto = z.object({
  locationId: zPrimitive.id,
  email: zPrimitive.email,
  password: z.string().min(6),
})
export type MokaConfigurationCreateDto = z.infer<typeof MokaConfigurationCreateDto>

export const MokaConfigurationUpdateDto = MokaConfigurationCreateDto.partial().extend({
  locationId: zPrimitive.id.optional(),
})
export type MokaConfigurationUpdateDto = z.infer<typeof MokaConfigurationUpdateDto>
