import z from 'zod'
import { zPrimitive, zSchema } from '@/lib/zod'

export const LocationType = z.enum(['store', 'warehouse'])
export type LocationType = z.infer<typeof LocationType>

export const LocationDto = z.object({
  id: zPrimitive.num,
  code: zPrimitive.str,
  name: zPrimitive.str,
  type: LocationType,
  description: zPrimitive.strNullable,
  isActive: zPrimitive.bool,
  ...zSchema.meta.shape,
})

export type LocationDto = z.infer<typeof LocationDto>

export const LocationMutationDto = z.object({
  name: zPrimitive.str,
  code: zPrimitive.str,
  type: LocationType,
  description: zPrimitive.str,
  isActive: zPrimitive.bool,
})

export type LocationMutationDto = z.infer<typeof LocationMutationDto>
