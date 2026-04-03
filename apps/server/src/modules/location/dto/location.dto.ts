import z from 'zod'

import { zMetadataDto, zPaginationDto, zRecordIdDto } from '@/core/validation'

import { locationClassificationEnum, locationTypeEnum } from '@/db/schema/_helpers'

/** Base schema for Location attributes. */
export const zLocationBase = z.object({
  code: z.string().trim().toUpperCase().min(2).max(20),
  name: z.string().trim().min(2).max(100),
  type: z.enum(locationTypeEnum.enumValues),
  classification: z.enum(locationClassificationEnum.enumValues).default('physical'),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
})

/** DTO for Creating a Location. */
export const zCreateLocationDto = zLocationBase

/** DTO for Updating a Location. */
export const zUpdateLocationDto = zLocationBase.partial()

/** DTO for Filtering/Searching Locations. */
export const zFilterLocationDto = zPaginationDto.extend({
  q: z.string().optional(),
  type: z.enum(locationTypeEnum.enumValues).optional(),
})

/** DTO for Location Response (Output). */
export const zLocationDto = zLocationBase.extend({
  ...zRecordIdDto.shape,
  ...zMetadataDto.shape,
})
