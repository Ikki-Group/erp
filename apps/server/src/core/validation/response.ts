import { z } from 'zod'

import { zAuditResolvedDto, zPaginationMeta } from './common'

// ============================================================================
// Standard Response Wrappers
// ============================================================================

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
 * const response = createListResponseSchema(itemSchema)
 * // { success: true, code: string, data: [{ id, name }], meta: { page, limit, total, totalPages } }
 */
export function createListResponseSchema<T extends z.ZodType>(itemSchema: T) {
	return z.object({
		success: z.literal(true),
		code: z.string().default('OK'),
		data: z.array(itemSchema),
		meta: zPaginationMeta,
	})
}

/**
 * Alias for createListResponseSchema - more explicit naming.
 * Standard Paginated Response Schema.
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
	return createListResponseSchema(itemSchema)
}

/**
 * Error Response Schema.
 * Standard error response format with optional details.
 *
 * @example
 * const errorResponse = z.object({
 *   success: false,
 *   code: 'VALIDATION_ERROR',
 *   message: 'Invalid input',
 *   details: [{ field: 'email', message: 'Invalid email' }]
 * })
 */
export function createErrorResponseSchema(detailsSchema: z.ZodType = z.unknown().optional()) {
	return z.object({
		success: z.literal(false),
		code: z.string(),
		message: z.string(),
		details: detailsSchema.optional(),
	})
}

// ============================================================================
// Schema Enhancement Helpers
// ============================================================================

/**
 * Extends a Zod schema with resolved audit attributes (creator and updater).
 * This makes the schema typesafe for endpoints resolving audit fields.
 *
 * @example
 * const UserSelectDto = zWithAuditResolved(
 *   z.object({
 *     id: zId,
 *     name: zStr,
 *     ...zAuditMeta.shape,
 *   }).shape,
 * )
 * // Result includes: { ..., creator, updater }
 */
export function zWithAuditResolved<T extends z.ZodRawShape>(shape: T) {
	return z.object({
		...shape,
		...zAuditResolvedDto.shape,
	})
}

// ============================================================================
// Exports
// ============================================================================

export const rs = {
	createSuccess: createSuccessResponseSchema,
	createList: createListResponseSchema,
	createPaginated: createPaginatedResponseSchema,
	createError: createErrorResponseSchema,
	withAuditResolved: zWithAuditResolved,
}
