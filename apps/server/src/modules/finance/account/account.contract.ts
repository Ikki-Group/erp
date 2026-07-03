import { z } from 'zod'

import { zc, zp, zq } from '@/shared/schema'

/* ---------------------------------- ENUM ---------------------------------- */

export const AccountTypeEnum = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
export type AccountTypeEnum = z.infer<typeof AccountTypeEnum>

/* ---------------------------------- ENTITY ---------------------------------- */

export const AccountDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	type: AccountTypeEnum,
	isGroup: zp.bool,
	parentId: zp.id.nullable(),
	...zc.AuditBasic.shape,
})
export type AccountDto = z.infer<typeof AccountDto>

/* -------------------------------- MUTATION -------------------------------- */

const AccountMutationDto = z.object({
	code: zc.strTrim.min(1).max(20),
	name: zc.strTrim.min(1).max(100),
	type: AccountTypeEnum,
	isGroup: zp.bool.default(false),
	parentId: zp.id.optional().nullable(),
})

export const AccountCreateDto = AccountMutationDto
export type AccountCreateDto = z.infer<typeof AccountCreateDto>

export const AccountUpdateDto = z.object({
	...zc.RecordId.shape,
	...AccountMutationDto.shape,
})
export type AccountUpdateDto = z.infer<typeof AccountUpdateDto>

/* --------------------------------- FILTER --------------------------------- */

export const AccountFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: AccountTypeEnum.optional(),
	parentId: zq.id.optional(),
})
export type AccountFilterDto = z.infer<typeof AccountFilterDto>
