import { z } from 'zod'

/**
 * Wraps a data DTO into the standard success response envelope.
 * Usage: `response: { 200: zRes.ok(LocationDto) }`
 */
function ok<T extends z.ZodType>(dataSchema: T) {
	return z.object({
		success: z.literal(true),
		data: dataSchema,
	})
}

/**
 * Wraps a data DTO into the standard created response envelope.
 * Same shape as ok — just semantic (201).
 */
function created<T extends z.ZodType>(dataSchema: T) {
	return z.object({
		success: z.literal(true),
		data: dataSchema,
	})
}

/**
 * Paginated response envelope.
 */
function paginated<T extends z.ZodType>(itemSchema: T) {
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

/** No-data success response. */
const noData = z.object({ success: z.literal(true) })

export const zRes = { ok, created, paginated, noData }
