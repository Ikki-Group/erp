import { z } from 'zod'

import { zc, zp, zq } from '@/lib/validation'

/** Audit action types */
export const AuditActionDto = z.enum(['create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'other'])
export type AuditActionDto = z.infer<typeof AuditActionDto>

export const AuditLogDto = z.object({
	...zc.RecordId.shape,
	userId: zc.numberInt,
	action: AuditActionDto,
	entityType: zp.str,
	entityId: zp.strNullable,
	description: zp.str,
	oldValue: zc.jsonNull,
	newValue: zc.jsonNull,
	ipAddress: zp.strNullable,
	userAgent: zp.strNullable,
	actionAt: zp.date,
	...zc.AuditBasic.shape,
})
export type AuditLogDto = z.infer<typeof AuditLogDto>

export const AuditLogCreateDto = z.object({
	userId: zc.numberInt,
	action: AuditActionDto,
	entityType: zc.strTrim.min(2).max(100),
	entityId: zc.strTrim.max(50).optional(),
	description: zc.strTrim.min(5).max(500),
	oldValue: zc.json.optional(),
	newValue: zc.json.optional(),
	ipAddress: zc.strTrim.max(45).optional().or(z.literal('')),
	userAgent: zc.strTrim.max(500).optional().or(z.literal('')),
})
export type AuditLogCreateDto = z.infer<typeof AuditLogCreateDto>

export const AuditLogFilterDto = z.object({
	q: zq.search,
	action: AuditActionDto.optional(),
	entityType: zp.str.optional(),
	userId: zc.numberInt.optional(),
	fromDate: zp.date.optional(),
	toDate: zp.date.optional(),
	...zq.pagination.shape,
})
export type AuditLogFilterDto = z.infer<typeof AuditLogFilterDto>
