import { z } from 'zod'

import { zp, zq } from '@/shared/schema/index.ts'

// ─── Enums ───

const AuditActionEnum = z.string().trim().min(1)

// ─── DTOs ───

export const AuditLogDto = z.object({
	id: zp.id,
	timestamp: zp.datetime,
	userId: zp.id,
	userName: zp.str,
	locationId: zp.num.nullable(),
	module: zp.str,
	entity: zp.str,
	entityId: zp.num,
	action: AuditActionEnum,
	summary: zp.str,
})
export type AuditLogDto = z.infer<typeof AuditLogDto>

export const AuditLogDetailDto = z.object({
	...AuditLogDto.shape,
	oldValues: z.unknown().nullable(),
	newValues: z.unknown().nullable(),
	metadata: z.unknown().nullable(),
})
export type AuditLogDetailDto = z.infer<typeof AuditLogDetailDto>

// ─── Filters ───

export const AuditLogFilterDto = z.object({
	...zq.pagination.shape,
	q: zq.search,
	module: z.string().trim().optional(),
	entity: z.string().trim().optional(),
	entityId: z.coerce.number().int().positive().optional(),
	userId: z.coerce.number().int().positive().optional(),
	action: AuditActionEnum.optional(),
	dateFrom: z.coerce.date().optional(),
	dateTo: z.coerce.date().optional(),
})
export type AuditLogFilterDto = z.infer<typeof AuditLogFilterDto>

export const AuditByEntityDto = z.object({
	entity: z.string().trim().min(1),
	entityId: z.coerce.number().int().positive(),
})
export type AuditByEntityDto = z.infer<typeof AuditByEntityDto>
