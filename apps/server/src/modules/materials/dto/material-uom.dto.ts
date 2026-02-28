import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialUomDto = z.object({
  isBase: zPrimitive.bool,
  materialId: zPrimitive.idNum,
  uomId: zPrimitive.str,
  conversionFactor: zPrimitive.num,
  ...zSchema.meta.shape,
})

export type MaterialUomDto = z.infer<typeof MaterialUomDto>

export const MaterialUomUpsertDto = z.object({
  ...MaterialUomDto.pick({
    isBase: true,
    materialId: true,
    uomId: true,
    conversionFactor: true,
  }).shape,
})

export type MaterialUomUpsertDto = z.infer<typeof MaterialUomUpsertDto>
