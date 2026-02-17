import z from 'zod'

/**
 * Common Zod Schemas & Helpers
 */

const str = z.string().trim()
const num = z.number()
const numCoerce = z.coerce.number()
const date = z.coerce.date()

/**
 * Validation Schemas
 * Reusable Zod schemas for input validation
 */
export const zSchema = {
  str,
  num,
  numCoerce,
  bool: z.boolean(),
  date,
  email: str.email(),
  uuid: str.uuid(),

  password: str.min(8, 'Password must be at least 8 characters').max(100, 'Password must not exceed 100 characters'),

  username: str.min(3, 'Username must be at least 3 characters').max(50, 'Username must not exceed 50 characters'),

  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),

  meta: z.object({
    createdAt: date,
    updatedAt: date,
    createdBy: num,
    updatedBy: num,
  }),

  /**
   * Query parameter helpers for HTTP requests
   */
  query: {
    /**
     * Converts string 'true'/'false' to boolean
     */
    boolean: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),

    /**
     * Optional search string with trimming
     */
    search: str.optional(),

    /**
     * Optional positive integer ID
     */
    id: numCoerce.int().positive().optional(),

    /**
     * Required positive integer ID
     */
    idRequired: numCoerce.int().positive(),
  },
}

/**
 * Response Schemas for OpenAPI
 * Helpers to generate Zod schemas for API documentation
 */
export const zResponse = {
  /**
   * Creates a standard success response schema
   */
  ok: <T extends z.ZodTypeAny>(data: T) =>
    z.object({
      success: z.literal(true),
      code: z.string(),
      data,
    }),

  /**
   * Creates a paginated response schema with metadata
   */
  paginated: <T extends z.ZodTypeAny>(data: T) =>
    z.object({
      success: z.literal(true),
      code: z.string(),
      data,
      meta: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }),
}

/**
 * @deprecated Use zSchema and zResponse instead
 * Alias for backward compatibility during refactor, will be removed
 */
export const zh = {
  ...zSchema,
  ...zResponse,
  resOk: zResponse.ok,
  resPaginated: zResponse.paginated,
}
