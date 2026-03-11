import z from 'zod'

import { zHttp, zPrimitive, zSchema } from '@/lib/validation'

import { LocationDto } from '@/modules/location/dto'
import { RecipeDto } from '@/modules/recipe/dto'

import { MaterialCategoryDto } from './material-category.dto'
import { UomDto } from './uom.dto'

/* ---------------------------------- ENUM ---------------------------------- */

const MaterialType = z.enum(['raw', 'semi'])
type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- NESTED --------------------------------- */

const MaterialConversionDto = z.object({
  toBaseFactor: zPrimitive.decimal,
  uomId: zPrimitive.id,
  uom: UomDto.optional(),
})

type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

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

/* --------------------------------- RESULT --------------------------------- */

export const MaterialSelectDto = z.object({
  ...MaterialDto.shape,
  category: MaterialCategoryDto.nullable(),
  uom: UomDto.nullable(),
  locations: LocationDto.array().optional(),
  recipe: RecipeDto.nullable().optional(),
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
