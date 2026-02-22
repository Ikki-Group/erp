import z from 'zod'

import { zPrimitive } from './primitive'

/**
 * HTTP Query Parameter Helpers
 * Schemas for parsing query string values from HTTP requests
 */
const query = {
  /** Converts string 'true'/'false' to boolean */
  boolean: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),

  /** Optional search string, returns undefined for empty strings */
  search: zPrimitive.str.optional().transform((val) => val || undefined),

  /** Optional positive integer ID (for query params) */
  id: zPrimitive.numCoerce.int().positive().optional(),

  /** Required positive integer ID (for query/body params) */
  idRequired: zPrimitive.numCoerce.int().positive(),

  num: zPrimitive.numCoerce,
}

/**
 * Pagination query schema
 */
const pagination = z.object({
  page: zPrimitive.numCoerce.int().positive().default(1),
  limit: zPrimitive.numCoerce.int().positive().max(100).default(10),
})

export const zHttp = {
  query,
  pagination,
}
