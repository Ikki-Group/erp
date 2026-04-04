import z from 'zod'

import {
  zStrNullable,
  zStr,
  zId,
  zDecimal,
  zQuerySearch,
  zQueryId,
  zQueryIds,
  zMetadataDto,
  zRecordIdDto,
} from '@/core/validation'
import { LocationDto } from '@/modules/location'
import { RecipeDto } from '@/modules/recipe'

import { MaterialCategoryDto } from './material-category.dto'
import { UomDto } from './uom.dto'

/* ---------------------------------- ENUM ---------------------------------- */

export const MaterialType = z.enum(['raw', 'semi', 'packaging'])
export type MaterialType = z.infer<typeof MaterialType>

/* --------------------------------- NESTED --------------------------------- */

export const MaterialConversionDto = z.object({ toBaseFactor: zDecimal, uomId: zId, uom: UomDto.optional() })

export type MaterialConversionDto = z.infer<typeof MaterialConversionDto>

/* --------------------------------- ENTITY --------------------------------- */

export const MaterialDto = z.object({
  ...zRecordIdDto.shape,
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
  locationIds: zQueryIds,
  excludeLocationIds: zQueryIds,
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
