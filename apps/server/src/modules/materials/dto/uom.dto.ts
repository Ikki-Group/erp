import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const UomDto = z.object({
  id: zPrimitive.idNum,
  code: zPrimitive.str,
  ...zSchema.meta.shape,
})

export type UomDto = z.infer<typeof UomDto>

/* --------------------------------- FILTER --------------------------------- */

export const UomFilterDto = z.object({
  search: zHttp.query.search,
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
  id: zPrimitive.idNum,
  ...UomCreateDto.shape,
})

export type UomUpdateDto = z.infer<typeof UomUpdateDto>
