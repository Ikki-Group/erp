import { z } from 'zod'

import { zc } from './common'

/**
 * Standard Success Response Schema.
 * Wraps any schema into { success: true, code: string, data: T }
 *
 * @example
 * const userSchema = z.object({ id: z.number(), name: z.string() })
 * const response = createSuccessResponseSchema(userSchema)
 * // { success: true, code: string, data: { id, name } }
 */
export function createSuccessResponseSchema<T extends z.ZodType>(dataSchema: T) {
	return z.object({
		success: z.literal(true),
		code: z.string().default('OK'),
		data: dataSchema,
	})
}

/**
 * Standard List Response Schema.
 * Wraps an array into { success: true, code: string, data: T[], meta: { ... } }
 *
 * @example
 * const itemSchema = z.object({ id: z.number(), name: z.string() })
 * const response = createPaginatedResponseSchema(itemSchema)
 * // { success: true, code: string, data: [{ id, name }], meta: { page, limit, total, totalPages } }
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
	return z.object({
		success: z.literal(true),
		code: z.string().default('OK'),
		data: z.array(itemSchema),
		meta: zc.PaginationMeta,
	})
}

export const successNoDataSchema = createSuccessResponseSchema(z.undefined())
