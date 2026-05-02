import { z } from 'zod'

import { zc, zp } from '@/core/validation'

export const CompanySettingsDto = z.object({
	...zc.RecordId.shape,
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
	settings: z.json().nullable(),
	...zc.AuditBasic.shape,
})
export type CompanySettingsDto = z.infer<typeof CompanySettingsDto>

export const CompanySettingsCreateDto = z.object({
	name: zc.strTrim.min(2).max(255),
	address: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	phone: zc.strTrim.min(10).max(20).optional().or(z.literal('')),
	email: zc.strTrim.email().optional().or(z.literal('')),
	taxId: zc.strTrim.min(10).max(50).optional().or(z.literal('')),
	taxRate: zc.strTrim
		.optional()
		.or(z.literal(''))
		.pipe(z.coerce.number().min(0).max(100).optional()),
	logoUrl: zc.strTrim.url().optional().or(z.literal('')),
	invoiceFooter: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	receiptFooter: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	currencyCode: zc.strTrim.min(3).max(3).default('IDR'),
	currencySymbol: zc.strTrim.min(1).max(3).default('Rp'),
	settings: z.json().optional(),
})
export type CompanySettingsCreateDto = z.infer<typeof CompanySettingsCreateDto>

export const CompanySettingsUpdateDto = z.object({
	...zc.RecordId.shape,
	name: zc.strTrim.min(2).max(255).optional(),
	address: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	phone: zc.strTrim.min(10).max(20).optional().or(z.literal('')),
	email: zc.strTrim.email().optional().or(z.literal('')),
	taxId: zc.strTrim.min(10).max(50).optional().or(z.literal('')),
	taxRate: zc.strTrim
		.optional()
		.or(z.literal(''))
		.pipe(z.coerce.number().min(0).max(100).optional()),
	logoUrl: zc.strTrim.url().optional().or(z.literal('')),
	invoiceFooter: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	receiptFooter: zc.strTrim.min(5).max(500).optional().or(z.literal('')),
	currencyCode: zc.strTrim.min(3).max(3).optional(),
	currencySymbol: zc.strTrim.min(1).max(3).optional(),
	settings: z.json().optional(),
})
export type CompanySettingsUpdateDto = z.infer<typeof CompanySettingsUpdateDto>
