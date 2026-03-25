import z from 'zod'

import { LocationDto } from '@/features/location'
import { RecipeDto } from '@/features/recipe'
import { zHttp, zPrimitive, zSchema } from '@/lib/zod'

import { MaterialCategoryDto } from './material-category.dto'
import { UomDto } from './uom.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialType = z.enum(['raw', 'semi'])
export type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- NESTED --------------------------------- */

export const MaterialConversionDto = z.object({
  toBaseFactor: zPrimitive.str,
  uomId: zPrimitive.id,
  uom: UomDto.optional(),
})

export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialDto = z.object({
  id: zPrimitive.id,
  name: zPrimitive.str,
  description: zPrimitive.strNullable,
  sku: zPrimitive.str,
  type: MaterialType,
  categoryId: zPrimitive.id.nullable(),
  baseUomId: zPrimitive.id,

  locationIds: zPrimitive.id.array(),
  conversions: MaterialConversionDto.array(),
  ...zSchema.metadata.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
  search: zHttp.query.search,
  type: MaterialType.optional(),
  categoryId: zHttp.query.id.optional(),
  locationIds: zHttp.query.ids,
  excludeLocationIds: zHttp.query.ids,
})

export type MaterialFilterDto = z.infer<typeof MaterialFilterDto>

/* --------------------------------- OUTPUT --------------------------------- */

export const MaterialOutputDto = z.object({
  ...MaterialDto.shape,
  category: MaterialCategoryDto.nullable(),
  uom: UomDto.nullable(),
  locations: LocationDto.array().optional(),
  recipe: RecipeDto.nullable().optional(),
})

export type MaterialOutputDto = z.infer<typeof MaterialOutputDto>

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
