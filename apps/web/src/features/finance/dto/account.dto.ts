import { z } from 'zod'

import {
  zId,
  zMetadataDto,
  zPaginationDto,
  zQuerySearch,
  zRecordIdDto,
  zStr,
} from '@/lib/zod'

export const AccountTypeEnum = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
export type AccountTypeEnum = z.infer<typeof AccountTypeEnum>

export const AccountDto = z.object({
  ...zRecordIdDto.shape,
  code: zStr,
  name: zStr,
  type: AccountTypeEnum,
  isGroup: z.boolean(),
  parentId: zId.nullable(),
  ...zMetadataDto.shape,
})
export type AccountDto = z.infer<typeof AccountDto>

export const AccountCreateDto = z.object({
  code: zStr,
  name: zStr,
  type: AccountTypeEnum,
  isGroup: z.boolean().default(false),
  parentId: zId.optional().nullable(),
})
export type AccountCreateDto = z.infer<typeof AccountCreateDto>

export const AccountUpdateDto = z.object({
  ...zRecordIdDto.shape,
  code: zStr,
  name: zStr,
  type: AccountTypeEnum,
  isGroup: z.boolean(),
  parentId: zId.optional().nullable(),
})
export type AccountUpdateDto = z.infer<typeof AccountUpdateDto>

export const AccountFilterDto = z.object({
  ...zPaginationDto.shape,
  search: zQuerySearch,
  type: AccountTypeEnum.optional(),
  parentId: zId.optional(),
})
export type AccountFilterDto = z.infer<typeof AccountFilterDto>
