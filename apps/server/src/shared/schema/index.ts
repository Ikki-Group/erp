import { z } from 'zod'

export { z }

// ─── Output primitives (zp) — no coercion, used in response DTOs ───

export const zp = {
	id: z.number().int().positive(),
	str: z.string(),
	bool: z.boolean(),
	num: z.number(),
	date: z.string().date(),
	datetime: z.string().datetime(),
	decimal: z.string().regex(/^\d+(\.\d+)?$/),
} as const

// ─── Input primitives (zc) — trimmed/validated, used in create/update DTOs ───

export const zc = {
	strTrim: z.string().trim().min(1),
	strTrimNullable: z.string().trim().nullable(),
	strOptional: z.string().trim().optional(),

	AuditBasic: z.object({
		createdAt: z.string().datetime(),
		updatedAt: z.string().datetime(),
		createdBy: z.number().int().nullable(),
		updatedBy: z.number().int().nullable(),
	}),

	RecordId: z.object({
		id: z.number().int().positive(),
	}),
} as const

// ─── Query primitives (zq) — coerced for query params ───

export const zq = {
	pagination: z.object({
		page: z.coerce.number().int().positive().default(1),
		limit: z.coerce.number().int().positive().max(100).default(20),
	}),

	search: z.string().trim().optional(),

	recordId: z.object({
		id: z.coerce.number().int().positive(),
	}),
} as const

// ─── Response wrappers ───

export function createSuccessResponseDto<T extends z.ZodTypeAny>(dataSchema: T) {
	return z.object({
		success: z.literal(true),
		data: dataSchema,
	})
}

export function createPaginatedResponseDto<T extends z.ZodTypeAny>(itemSchema: T) {
	return z.object({
		success: z.literal(true),
		data: z.array(itemSchema),
		meta: z.object({
			page: z.number(),
			limit: z.number(),
			total: z.number(),
			totalPages: z.number(),
		}),
	})
}
