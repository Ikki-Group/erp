import { z } from 'zod'

import { zc, zp } from '@/shared/schema'

export const CompanySettingsDto = z.object({
	id: zp.id,
	name: zp.str,
	address: zp.strNullable,
	phone: zp.strNullable,
	email: zp.strNullable,
	taxId: zp.strNullable,
	taxRate: zp.decimal,
	logoUrl: zp.strNullable,
	invoiceFooter: zp.strNullable,
	receiptFooter: zp.strNullable,
	currencyCode: zp.str,
	currencySymbol: zp.str,
	settings: z.unknown().nullable(),
	...zc.AuditBasic.shape,
})
export type CompanySettingsDto = z.infer<typeof CompanySettingsDto>

const CompanySettingsMutationDto = z.object({
	name: zc.strTrim.min(2).max(255),
	address: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	phone: zc.strTrim.min(10).max(20).optional().or(z.literal('')),
	email: z
		.union([z.string().email(), z.literal('')])
		.optional()
		.transform((v) => (v === '' ? undefined : v)),
	taxId: zc.strTrim.min(10).max(50).optional().or(z.literal('')),
	taxRate: zc.strTrim
		.optional()
		.or(z.literal(''))
		.transform((v) => (v === '' ? undefined : Number(v)))
		.pipe(z.number().min(0).max(100).optional()),
	logoUrl: z
		.union([z.string().url(), z.literal('')])
		.optional()
		.transform((v) => (v === '' ? undefined : v)),
	invoiceFooter: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	receiptFooter: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	currencyCode: zc.strTrim.min(3).max(3).default('IDR'),
	currencySymbol: zc.strTrim.min(1).max(3).default('Rp'),
	settings: z.unknown().optional(),
})

export const CompanySettingsCreateDto = CompanySettingsMutationDto
export type CompanySettingsCreateDto = z.infer<typeof CompanySettingsCreateDto>

export const CompanySettingsUpdateDto = z.object({
	id: zp.id,
	name: zc.strTrim.min(2).max(255).optional(),
	address: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	phone: zc.strTrim.min(10).max(20).optional().or(z.literal('')),
	email: z
		.union([z.string().email(), z.literal('')])
		.optional()
		.transform((v) => (v === '' ? undefined : v)),
	taxId: zc.strTrim.min(10).max(50).optional().or(z.literal('')),
	taxRate: zc.strTrim
		.optional()
		.or(z.literal(''))
		.transform((v) => (v === '' ? undefined : Number(v)))
		.pipe(z.number().min(0).max(100).optional()),
	logoUrl: z
		.union([z.string().url(), z.literal('')])
		.optional()
		.transform((v) => (v === '' ? undefined : v)),
	invoiceFooter: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	receiptFooter: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	currencyCode: zc.strTrim.min(3).max(3).optional(),
	currencySymbol: zc.strTrim.min(1).max(3).optional(),
	settings: z.unknown().optional(),
})
export type CompanySettingsUpdateDto = z.infer<typeof CompanySettingsUpdateDto>
