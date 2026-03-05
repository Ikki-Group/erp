import z from 'zod'
import { MaterialCategoryDto } from './material-category.dto'
import { UomDto } from './uom.dto'
import { zPrimitive, zSchema } from '@/lib/zod'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialType = z.enum(['raw', 'semi'])
export type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- ENTITY --------------------------------- */

const MaterialConversionDto = z.object({
  uomId: zPrimitive.id,
  toBaseFactor: zPrimitive.str,
})

export const MaterialDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.id.nullable(),
  baseUomId: zPrimitive.id,

  locationIds: zPrimitive.id.array(),
  conversions: z.array(MaterialConversionDto),
  ...zSchema.meta.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- SELECT --------------------------------- */

export const MaterialSelectDto = z.object({
  ...MaterialDto.shape,
  category: MaterialCategoryDto.nullable(),
  uom: UomDto.nullable(),
})

export type MaterialSelectDto = z.infer<typeof MaterialSelectDto>

/* -------------------------------- MUTATION -------------------------------- */

export const MaterialMutationDto = z.object({
  ...MaterialDto.pick({
    name: true,
    description: true,
    sku: true,
    type: true,
    categoryId: true,
    baseUomId: true,
    conversions: true,
  }).shape,
})

export type MaterialMutationDto = z.infer<typeof MaterialMutationDto>
