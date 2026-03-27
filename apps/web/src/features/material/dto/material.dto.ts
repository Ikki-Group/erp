import z from 'zod'

import { LocationDto } from '@/features/location'
import { RecipeDto } from '@/features/recipe'
import { zStrNullable, zStr, zId, zQuerySearch, zQueryId, zQueryIds, zMetadataDto } from '@/lib/zod'

import { MaterialCategoryDto } from './material-category.dto'
import { UomDto } from './uom.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialType = z.enum(['raw', 'semi'])
export type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- NESTED --------------------------------- */

export const MaterialConversionDto = z.object({
  toBaseFactor: zStr,
  uomId: zId,
  uom: UomDto.optional(),
})

export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialDto = z.object({
  id: zId,
  name: zStr,
  description: zStrNullable,
  sku: zStr,
  type: MaterialType,
  categoryId: zId.nullable(),
  baseUomId: zId,

  locationIds: zId.array(),
  conversions: MaterialConversionDto.array(),
  ...zMetadataDto.shape,
})

export type MaterialDto = z.infer<typeof MaterialDto>

/* --------------------------------- FILTER --------------------------------- */

export const MaterialFilterDto = z.object({
  search: zQuerySearch,
  type: MaterialType.optional(),
  categoryId: zQueryId.optional(),
  locationIds: zQueryIds.optional(),
  excludeLocationIds: zQueryIds.optional(),
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
