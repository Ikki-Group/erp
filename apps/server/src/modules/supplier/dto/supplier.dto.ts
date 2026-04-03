import { z } from 'zod'

import { zStr, zStrNullable, zMetadataDto, zRecordIdDto, zQuerySearch, zPaginationDto } from '@/core/validation'

export const SupplierDto = z.object({
  ...zRecordIdDto.shape,
  code: zStr,
  name: zStr,
  email: zStrNullable,
  phone: zStrNullable,
  address: zStrNullable,
  taxId: zStrNullable,
  ...zMetadataDto.shape,
})
export type SupplierDto = z.infer<typeof SupplierDto>

export const SupplierCreateDto = z.object({
  code: zStr,
  name: zStr,
  email: zStr.optional().nullable(),
  phone: zStr.optional().nullable(),
  address: zStr.optional().nullable(),
  taxId: zStr.optional().nullable(),
})
export type SupplierCreateDto = z.infer<typeof SupplierCreateDto>

export const SupplierUpdateDto = z.object({
  ...zRecordIdDto.shape,
  code: zStr,
  name: zStr,
  email: zStr.optional().nullable(),
  phone: zStr.optional().nullable(),
  address: zStr.optional().nullable(),
  taxId: zStr.optional().nullable(),
})
export type SupplierUpdateDto = z.infer<typeof SupplierUpdateDto>

export const SupplierFilterDto = z.object({
  ...zPaginationDto.shape,
  search: zQuerySearch,
})
export type SupplierFilterDto = z.infer<typeof SupplierFilterDto>
