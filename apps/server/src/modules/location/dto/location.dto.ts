import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

export const LocationType = z.enum(['store', 'warehouse'])

export type LocationType = z.infer<typeof LocationType>

export const LocationDto = z.object({
  id: zPrimitive.num,
  code: zPrimitive.str.transform((val) => val.toUpperCase().trim()),
  name: zPrimitive.str,
  type: LocationType,
  description: z
    .string()
    .nullable()
    .transform((val) => val?.trim() || null),
  isActive: zPrimitive.bool,
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
