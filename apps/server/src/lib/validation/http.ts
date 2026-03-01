import z from 'zod'

import { zPrimitive } from './primitive'

/**
 * HTTP Query Parameter Helpers
 * Schemas for parsing query string values from HTTP requests
 */
const query = {
  objId: zPrimitive.objId,

  /** Converts string 'true'/'false' to boolean */
  boolean: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
    // eslint-disable-next-line unicorn/no-useless-undefined
    .catch(undefined),

  /** Optional search string, returns undefined for empty strings */
  search: zPrimitive.str.optional().transform((val) => val || undefined),
  num: zPrimitive.numCoerce,
}

const pagination = z.object({
  page: zPrimitive.numCoerce.int().positive().default(1),
  limit: zPrimitive.numCoerce.int().positive().max(100).default(10),
})

const paginationMeta = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

const recordId = z.object({ id: zPrimitive.objId })

function ok<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    code: z.string(),
    data,
  })
}

function paginated<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    success: z.literal(true),
    code: z.string().default('OK'),
    data,
    meta: paginationMeta,
  })
}

export const zHttp = {
  query,
  pagination,
  recordId,
  ok,
  paginated,
}
