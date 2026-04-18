import { z } from 'zod'

import { zc, zp, zq } from '@/core/validation'

/* ---------------------------------- ENUM ---------------------------------- */

export const ExpenditureTypeEnum = z.enum(['BILLS', 'ASSET', 'PURCHASES'])
export type ExpenditureTypeEnum = z.infer<typeof ExpenditureTypeEnum>

export const ExpenditureStatusEnum = z.enum(['PENDING', 'PAID', 'VOID', 'REFUNDED'])
export type ExpenditureStatusEnum = z.infer<typeof ExpenditureStatusEnum>

/* ---------------------------------- ENTITY ---------------------------------- */

export const ExpenditureDto = z.object({
	...zc.RecordId.shape,
	type: ExpenditureTypeEnum,
	status: ExpenditureStatusEnum,
	title: zp.str,
	description: zp.strNullable,
	date: zp.date,
	amount: zp.decimal,
	sourceAccountId: zp.id,
	targetAccountId: zp.id,
	liabilityAccountId: zp.id.nullable(),
	supplierId: zp.id.nullable(),
	locationId: zp.id,
	isInstallment: zp.bool,
	...zc.AuditBasic.shape,
})
export type ExpenditureDto = z.infer<typeof ExpenditureDto>

/* -------------------------------- MUTATION -------------------------------- */

export const ExpenditureCreateDto = z.object({
	type: ExpenditureTypeEnum,
	status: ExpenditureStatusEnum.default('PAID'),
	title: zc.strTrim.min(3).max(100),
	description: zc.strTrimNullable,
	date: zp.date.default(() => new Date()),
	amount: zp.decimal,
	sourceAccountId: zp.id,
	targetAccountId: zp.id,
	liabilityAccountId: zp.id.optional().nullable(),
	supplierId: zp.id.optional().nullable(),
	locationId: zp.id,
	isInstallment: zp.bool.default(false),
})
export type ExpenditureCreateDto = z.infer<typeof ExpenditureCreateDto>

export const ExpenditureUpdateDto = ExpenditureCreateDto.extend({
	...zc.RecordId.shape,
})
export type ExpenditureUpdateDto = z.infer<typeof ExpenditureUpdateDto>

/* --------------------------------- FILTER --------------------------------- */

export const ExpenditureFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: ExpenditureTypeEnum.optional(),
	status: ExpenditureStatusEnum.optional(),
	locationId: zq.id.optional(),
})
export type ExpenditureFilterDto = z.infer<typeof ExpenditureFilterDto>
