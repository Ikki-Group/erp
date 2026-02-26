import z from 'zod'

import { zPrimitive } from '@/lib/validation'

/* --------------------------------- ENTITY --------------------------------- */

export const ItemUnitConversionDto = z.object({
  id: zPrimitive.idNum.optional(),
  itemId: zPrimitive.idNum,
  fromUnit: zPrimitive.str,
  toUnit: zPrimitive.str,
  multiplier: zPrimitive.num,
})

export type ItemUnitConversionDto = z.infer<typeof ItemUnitConversionDto>
