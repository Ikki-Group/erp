import z from 'zod'

/**
 * Response Schemas for OpenAPI documentation
 */

const paginationMeta = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

/** Creates a standard success response schema */
function ok<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    code: z.string(),
    data,
  })
}

/** Creates a paginated response schema with metadata */
function paginated<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    code: z.string().default('OK'),
    data,
    meta: paginationMeta,
  })
}

export const zResponse = {
  ok,
  paginated,
}
