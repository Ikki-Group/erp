import z from 'zod'

import { zPrimitive } from './primitive'

/**
 * HTTP Query Parameter Helpers
 * Schemas for parsing query string values from HTTP requests
 */
const query = {
  /** Coerces a query-string value to a positive integer ID */
  id: zPrimitive.id,

  /** Converts string 'true'/'false' to boolean */
  boolean: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
    .catch(undefined),

  /** Optional search string, returns undefined for empty strings */
  search: zPrimitive.str.optional().transform((val) => val || undefined),
  num: zPrimitive.numCoerce,
  /** Coerces single or multiple query parameters into an array of IDs. Returns undefined if input is undefined. */
  ids: z.preprocess(
    (val) => (val === undefined ? undefined : Array.isArray(val) ? val : [val]),
    z.array(zPrimitive.id).optional()
  ),
}

const pagination = z.object({
  page: zPrimitive.numCoerce.int().positive().default(1),
  limit: zPrimitive.numCoerce.int().positive().max(100).default(10),
})

const recordId = z.object({ id: zPrimitive.id })

export const zHttp = {
  query,
  pagination,
  recordId,
}
