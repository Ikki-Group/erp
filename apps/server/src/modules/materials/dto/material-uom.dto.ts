import z from 'zod'

import { zPrimitive } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialUomDto = z.object({
  materialId: zPrimitive.idNum,
  uomId: zPrimitive.idNum,
  conversionFactor: zPrimitive.str,
})

export type MaterialUomDto = z.infer<typeof MaterialUomDto>

export const MaterialUomUpsertDto = z.object({
  ...MaterialUomDto.pick({
    uomId: true,
    conversionFactor: true,
  }).shape,
})

export type MaterialUomUpsertDto = z.infer<typeof MaterialUomUpsertDto>
