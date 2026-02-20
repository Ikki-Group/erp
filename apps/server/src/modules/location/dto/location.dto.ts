import z from 'zod'

import { zSchema } from '@/lib/zod'

export const LocationType = z.enum(['store', 'warehouse'])

export type LocationType = z.infer<typeof LocationType>

export const LocationDto = z.object({
  id: zSchema.num,
  code: zSchema.str.transform((val) => val.toUpperCase().trim()),
  name: zSchema.str,
  type: LocationType,
  description: z
    .string()
    .nullable()
    .transform((val) => val?.trim() || null),
  isActive: zSchema.bool,
  ...zSchema.meta.shape,
})

export type LocationDto = z.infer<typeof LocationDto>

export const LocationMutationDto = z.object({
  ...LocationDto.pick({
    code: true,
    name: true,
    type: true,
    description: true,
    isActive: true,
  }).partial({
    isActive: true,
  }).shape,
})

export type LocationMutationDto = z.infer<typeof LocationMutationDto>
