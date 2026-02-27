import z from 'zod'

import { zPrimitive, zSchema } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialUomConversionDto = z.object({
  materialId: zPrimitive.idNum,
  fromUomCode: zPrimitive.str,
  toUomCode: zPrimitive.str,
  multiplier: zPrimitive.num,
  ...zSchema.meta.shape,
})

export type MaterialUomConversionDto = z.infer<typeof MaterialUomConversionDto>
