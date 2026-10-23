import { z } from 'zod'

import { zc, zp } from '@/lib/validation/index.ts'

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

// ─── Update ───

export const CompanySettingsUpdateDto = z.object({
	id: zp.id,
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
export type CompanySettingsUpdateDto = z.infer<typeof CompanySettingsUpdateDto>

// ─── Overview ───

const count = z.number().int()

export const CompanyOverviewSiteDto = z.object({
	id: zp.id,
	code: zp.str,
	name: zp.str,
	type: z.enum(['store', 'warehouse']),
	isActive: z.boolean(),
	staff: count,
	transfersInTransit: count,
	draftReceivings: count,
	openOpnames: count,
	lowStock: count,
	openShifts: count,
	salesToday: z.object({ orders: count, revenue: zp.str }),
})
export type CompanyOverviewSiteDto = z.infer<typeof CompanyOverviewSiteDto>

export const CompanyOverviewDto = z.object({
	locations: z.object({ total: count, stores: count, warehouses: count, inactive: count }),
	// null when the caller lacks a global iam.read grant.
	people: z
		.object({
			activeUsers: count,
			inactiveUsers: count,
			usersWithoutAccess: count,
			roles: count,
		})
		.nullable(),
	businessDate: zp.str,
	sites: z.array(CompanyOverviewSiteDto),
})
export type CompanyOverviewDto = z.infer<typeof CompanyOverviewDto>
