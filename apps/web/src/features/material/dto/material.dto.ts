import z from 'zod'
import { zPrimitive, zSchema } from '@/lib/zod'

export const MaterialType = z.enum(['raw', 'semi'])
export type MaterialType = z.infer<typeof MaterialType>

const MaterialUomDto = z.object({
  materialId: zPrimitive.str,
  uomId: zPrimitive.str,
  conversionFactor: zPrimitive.str,
})

export const MaterialDto = z.object({
  id: zPrimitive.str,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.str.nullable(),
  baseUomId: zPrimitive.str,
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
  categoryId: zPrimitive.str.nullable(),
  baseUomId: zPrimitive.str,
  conversions: z.array(
    z.object({
      uomId: zPrimitive.str,
      conversionFactor: zPrimitive.str,
    })
  ),
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
