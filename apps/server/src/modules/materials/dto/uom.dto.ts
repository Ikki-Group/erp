import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const UomDto = z.object({
  code: zPrimitive.str,
  ...zSchema.meta.shape,
})

export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({
  search: zPrimitive.str,
})

export type UomFilterDto = z.infer<typeof UomFilterDto>

/* --------------------------------- MUTATION --------------------------------- */

export const UomCreateDto = z.object({
  ...UomDto.pick({
    code: true,
  }).shape,
})

export type UomCreateDto = z.infer<typeof UomCreateDto>

export const UomUpdateDto = z.object({
  code: zPrimitive.str,
  ...UomCreateDto.omit({ code: true }).shape,
})

export type UomUpdateDto = z.infer<typeof UomUpdateDto>
