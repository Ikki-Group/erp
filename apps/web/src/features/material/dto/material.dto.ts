import z from 'zod'
import { zPrimitive, zSchema } from '@/lib/zod'

export const MaterialType = z.enum(['raw', 'semi'])
export type MaterialType = z.infer<typeof MaterialType>

const MaterialUomDto = z.object({
  materialId: zPrimitive.idNum,
  uomId: zPrimitive.idNum,
  conversionFactor: zPrimitive.str,
})

export const MaterialDto = z.object({
  id: zPrimitive.idNum,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.idNum.nullable(),
  baseUomId: zPrimitive.idNum,
  ...zSchema.meta.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

export const MaterialSelectDto = z.object({
  ...MaterialDto.shape,
  conversions: z.array(MaterialUomDto),
})

export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>

export const MaterialMutationDto = z.object({
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.idNum.nullable(),
  baseUomId: zPrimitive.idNum,
  conversions: z.array(
    z.object({
      uomId: zPrimitive.idNum,
      conversionFactor: zPrimitive.str,
    })
  ),
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
