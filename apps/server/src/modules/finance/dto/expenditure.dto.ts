import { z } from 'zod'

import {
	zStr,
	zMetadataDto,
	zRecordIdDto,
	zQuerySearch,
	zPaginationDto,
	zId,
	zDate,
	zDecimal,
	zBool,
	zStrNullable,
} from '@/core/validation'

export const ExpenditureTypeEnum = z.enum(['BILLS', 'ASSET', 'PURCHASES'])
export type ExpenditureTypeEnum = z.infer<typeof ExpenditureTypeEnum>

export const ExpenditureStatusEnum = z.enum(['PENDING', 'PAID', 'VOID', 'REFUNDED'])
export type ExpenditureStatusEnum = z.infer<typeof ExpenditureStatusEnum>

export const ExpenditureDto = z.object({
	...zRecordIdDto.shape,
	type: ExpenditureTypeEnum,
	status: ExpenditureStatusEnum,
	title: zStr,
	description: zStrNullable,
	date: zDate,
	amount: zDecimal,
	sourceAccountId: zId,
	targetAccountId: zId,
	liabilityAccountId: zId.nullable(),
	supplierId: zId.nullable(),
	locationId: zId,
	isInstallment: zBool,
	...zMetadataDto.shape,
})
export type ExpenditureDto = z.infer<typeof ExpenditureDto>

export const ExpenditureCreateDto = z.object({
	type: ExpenditureTypeEnum,
	status: ExpenditureStatusEnum.default('PAID'),
	title: zStr,
	description: zStr.optional().nullable(),
	date: zDate.default(() => new Date()),
	amount: zDecimal,
	sourceAccountId: zId,
	targetAccountId: zId,
	liabilityAccountId: zId.optional().nullable(),
	supplierId: zId.optional().nullable(),
	locationId: zId,
	isInstallment: zBool.default(false),
})
export type ExpenditureCreateDto = z.infer<typeof ExpenditureCreateDto>

export const ExpenditureFilterDto = z.object({
	...zPaginationDto.shape,
	search: zQuerySearch,
	type: ExpenditureTypeEnum.optional(),
	status: ExpenditureStatusEnum.optional(),
	locationId: zId.optional(),
})
export type ExpenditureFilterDto = z.infer<typeof ExpenditureFilterDto>
