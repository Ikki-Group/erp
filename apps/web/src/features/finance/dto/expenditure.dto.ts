import { z } from 'zod'

import { zc } from '@/lib/validation'

export const ExpenditureTypeEnum = z.enum(['BILLS', 'ASSET', 'PURCHASES'])
export type ExpenditureTypeEnum = z.infer<typeof ExpenditureTypeEnum>

export const ExpenditureStatusEnum = z.enum(['PENDING', 'PAID', 'VOID', 'REFUNDED'])
export type ExpenditureStatusEnum = z.infer<typeof ExpenditureStatusEnum>

export const ExpenditureDto = z.object({
	id: z.number(),
	type: ExpenditureTypeEnum,
	status: ExpenditureStatusEnum,
	title: z.string(),
	description: z.string().nullable(),
	date: z.string().or(z.date()),
	amount: z.string().or(z.number()),
	sourceAccountId: z.number(),
	targetAccountId: z.number(),
	liabilityAccountId: z.number().nullable(),
	supplierId: z.number().nullable(),
	locationId: z.number(),
	isInstallment: z.boolean(),
	createdAt: z.string().or(z.date()),
	updatedAt: z.string().or(z.date()),
	createdBy: z.number(),
	updatedBy: z.number().nullable(),
})
export type ExpenditureDto = z.infer<typeof ExpenditureDto>

export const ExpenditureCreateDto = z.object({
	type: ExpenditureTypeEnum,
	status: ExpenditureStatusEnum.default('PAID'),
	title: z.string().min(1, 'Judul wajib diisi'),
	description: z.string().optional().nullable(),
	date: z.date().default(() => new Date()),
	amount: z.number().min(1, 'Nominal wajib diisi'),
	sourceAccountId: z.number({ required_error: 'Pilih asal dana' }),
	targetAccountId: z.number({ required_error: 'Pilih kategori biaya/aset' }),
	liabilityAccountId: z.number().optional().nullable(),
	supplierId: z.number().optional().nullable(),
	locationId: z.number({ required_error: 'Lokasi wajib diisi' }),
	isInstallment: z.boolean().default(false),
})
export type ExpenditureCreateDto = z.infer<typeof ExpenditureCreateDto>

export const ExpenditureFilterDto = z.object({
	page: z.number().optional(),
	limit: z.number().optional(),
	search: z.string().optional(),
	type: ExpenditureTypeEnum.optional(),
	status: ExpenditureStatusEnum.optional(),
	locationId: z.number().optional(),
})
export type ExpenditureFilterDto = z.infer<typeof ExpenditureFilterDto>
