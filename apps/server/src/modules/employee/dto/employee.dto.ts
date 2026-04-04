import { z } from 'zod'

import { zStr, zStrNullable, zMetadataDto, zRecordIdDto, zQuerySearch, zPaginationDto, zId } from '@/core/validation'

export const EmployeeDto = z.object({
  ...zRecordIdDto.shape,
  code: zStr,
  name: zStr,
  email: zStrNullable,
  phone: zStrNullable,
  jobTitle: zStrNullable,
  department: zStrNullable,
  userId: zId.nullable(),
  ...zMetadataDto.shape,
})
export type EmployeeDto = z.infer<typeof EmployeeDto>

export const EmployeeCreateDto = z.object({
  code: zStr,
  name: zStr,
  email: zStr.optional().nullable(),
  phone: zStr.optional().nullable(),
  jobTitle: zStr.optional().nullable(),
  department: zStr.optional().nullable(),
  userId: zId.optional().nullable(),
})
export type EmployeeCreateDto = z.infer<typeof EmployeeCreateDto>

export const EmployeeUpdateDto = z.object({
  ...zRecordIdDto.shape,
  code: zStr,
  name: zStr,
  email: zStr.optional().nullable(),
  phone: zStr.optional().nullable(),
  jobTitle: zStr.optional().nullable(),
  department: zStr.optional().nullable(),
  userId: zId.optional().nullable(),
})
export type EmployeeUpdateDto = z.infer<typeof EmployeeUpdateDto>

export const EmployeeFilterDto = z.object({ ...zPaginationDto.shape, search: zQuerySearch })
export type EmployeeFilterDto = z.infer<typeof EmployeeFilterDto>
