import { z } from 'zod'

import { zp, zc, zq } from '@/lib/validation'

export const AccountTypeEnum = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'])
export type AccountTypeEnum = z.infer<typeof AccountTypeEnum>

export const AccountDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	type: AccountTypeEnum,
	isGroup: z.boolean(),
	parentId: zp.id.nullable(),
	...zc.AuditFull.shape,
})
export type AccountDto = z.infer<typeof AccountDto>

export const AccountCreateDto = z.object({
	code: zp.str,
	name: zp.str,
	type: AccountTypeEnum,
	isGroup: z.boolean().default(false),
	parentId: zp.id.optional().nullable(),
})
export type AccountCreateDto = z.infer<typeof AccountCreateDto>

export const AccountUpdateDto = z.object({
	...zc.RecordId.shape,
	code: zp.str,
	name: zp.str,
	type: AccountTypeEnum,
	isGroup: z.boolean(),
	parentId: zp.id.optional().nullable(),
})
export type AccountUpdateDto = z.infer<typeof AccountUpdateDto>

export const AccountFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	type: AccountTypeEnum.optional(),
	parentId: zp.id.optional(),
})
export type AccountFilterDto = z.infer<typeof AccountFilterDto>
