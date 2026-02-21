import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const LocationType = z.enum(['store', 'warehouse'])

export type LocationType = z.infer<typeof LocationType>

/* --------------------------------- ENTITY --------------------------------- */

export const LocationDto = z.object({
  id: zPrimitive.num,
  code: zPrimitive.codeUpper,
  name: zPrimitive.str,
  type: LocationType,
  description: zPrimitive.strNullable,
  isActive: zPrimitive.bool,
  ...zSchema.meta.shape,
})

export type LocationDto = z.infer<typeof LocationDto>

/* --------------------------------- FILTER --------------------------------- */

export const LocationFilterDto = z.object({
  search: zHttp.query.search,
  type: LocationType.optional(),
  isActive: zHttp.query.boolean,
})

export type LocationFilterDto = z.infer<typeof LocationFilterDto>

/* -------------------------------- MUTATION -------------------------------- */

export const LocationCreateDto = z.object({
  ...LocationDto.pick({
    code: true,
    name: true,
    type: true,
    description: true,
    isActive: true,
  }).shape,
})

export type LocationCreateDto = z.infer<typeof LocationCreateDto>

export const LocationUpdateDto = z.object({
  id: zPrimitive.num,
  ...LocationCreateDto.shape,
})

export type LocationUpdateDto = z.infer<typeof LocationUpdateDto>
