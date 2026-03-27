import z from 'zod'

/**
 * Response Schemas for OpenAPI documentation
 */

export const zPaginationMetaDto = z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() })

export type PaginationMeta = z.infer<typeof zPaginationMetaDto>

/** Creates a standard success response schema */
export function createSuccessResponseSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ success: z.literal(true), code: z.string(), data })
}

/** Creates a paginated response schema with metadata */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ success: z.literal(true), code: z.string().default('OK'), data, meta: zPaginationMetaDto })
}
