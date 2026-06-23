import { z } from 'zod'
import { zc, zp, zq } from '@/shared/schema'

/** Audit action types */
const auditActionValues = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'OTHER'] as const
export const AuditActionSchema = z.enum(auditActionValues)
export type AuditActionSchema = z.infer<typeof AuditActionSchema>

export const AuditLogSchema = z.object({
	...zc.RecordId.shape,
	userId: zp.id,
	action: AuditActionSchema,
	entityType: zp.str,
	entityId: zp.strNullable,
	description: zp.str,
	oldValue: z.unknown().nullable(),
	newValue: z.unknown().nullable(),
	ipAddress: zp.strNullable,
	userAgent: zp.strNullable,
	actionAt: zp.date,
	...zc.AuditBasic.shape,
})
export type AuditLogSchema = z.infer<typeof AuditLogSchema>

export const AuditLogCreateSchema = z.object({
	userId: zp.id,
	action: AuditActionSchema,
	entityType: zc.strTrim.min(2).max(100),
	entityId: zc.strTrim.max(50).optional(),
	description: zc.strTrim.min(5).max(500),
	oldValue: z.unknown().optional(),
	newValue: z.unknown().optional(),
	ipAddress: zc.strTrim.max(45).optional().or(z.literal('')),
	userAgent: zc.strTrim.max(500).optional().or(z.literal('')),
})
export type AuditLogCreateSchema = z.infer<typeof AuditLogCreateSchema>

export const AuditLogFilterSchema = z.object({
	q: zq.search,
	action: z.enum(auditActionValues).nullish(),
	entityType: zp.str.optional(),
	userId: zp.id.optional(),
	fromDate: zp.date.optional(),
	toDate: zp.date.optional(),
	...zq.pagination.shape,
})
export type AuditLogFilterSchema = z.infer<typeof AuditLogFilterSchema>
