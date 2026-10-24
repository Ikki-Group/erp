import { z } from 'zod'

import { zc, zp } from '@/shared/schema/index.ts'

// ─── Mutation Base (internal, not exported) ───

const CompanySettingsMutationDto = z.object({
	name: zc.strTrim.min(2).max(255),
	address: zc.strTrimNullable.optional(),
	phone: zc.strTrimNullable.optional(),
	email: zc.strTrimNullable.optional(),
	taxId: zc.strTrimNullable.optional(),
	taxRate: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/u)
		.optional()
		.default('0'),
	currencyCode: zc.strTrim.max(10).optional().default('IDR'),
	currencySymbol: zc.strTrim.max(10).optional().default('Rp'),
	logoUrl: zc.strTrimNullable.optional(),
	receiptFooter: zc.strTrimNullable.optional(),
})

// ─── Response ───

export const CompanySettingsDto = z.object({
	id: zp.id,
	name: zp.str,
	address: zp.str.nullable(),
	phone: zp.str.nullable(),
	email: zp.str.nullable(),
	taxId: zp.str.nullable(),
	taxRate: zp.str,
	currencyCode: zp.str,
	currencySymbol: zp.str,
	logoUrl: zp.str.nullable(),
	receiptFooter: zp.str.nullable(),
	...zc.AuditBasic.shape,
})
export type CompanySettingsDto = z.infer<typeof CompanySettingsDto>

// ─── Create / Update ───

export const CompanySettingsCreateDto = CompanySettingsMutationDto
export type CompanySettingsCreateDto = z.infer<typeof CompanySettingsCreateDto>

export const CompanySettingsUpdateDto = z.object({
	id: zp.id,
	...CompanySettingsMutationDto.shape,
})
export type CompanySettingsUpdateDto = z.infer<typeof CompanySettingsUpdateDto>
