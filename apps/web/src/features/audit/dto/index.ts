import { z } from 'zod'

import { zp, zq } from '@/lib/validation/index.ts'

// ─── Response ───

export const AuditLogDto = z.object({
	id: zp.id,
	timestamp: zp.date,
	userId: zp.id,
	userName: zp.str,
	locationId: zp.num.nullable(),
	module: zp.str,
	entity: zp.str,
	entityId: zp.num,
	action: zp.str,
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
	action: z.string().trim().optional(),
	// ISO strings on the wire; the server's `z.coerce.date()` parses them. Mirrors
	// the POS/inventory list filters — `String(Date)` in query params would emit a
	// locale string, so the route sends `.toISOString()`.
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
})
export type AuditLogFilterDto = z.infer<typeof AuditLogFilterDto>

export const AuditByEntityDto = z.object({
	entity: z.string().trim().min(1),
	entityId: z.coerce.number().int().positive(),
})
export type AuditByEntityDto = z.infer<typeof AuditByEntityDto>
