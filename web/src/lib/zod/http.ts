import z from 'zod'

import { zPrimitive } from './primitive'

const paginationMeta = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

export type PaginationMeta = z.infer<typeof paginationMeta>

export const zHttp = {
  boolean: z
    .preprocess(
      val => (typeof val === 'boolean' ? (val ? 'true' : 'false') : val),
      z.enum(['true', 'false']).optional()
    )
    .transform(val => val === 'true')
    .optional(),

  query: {
    id: zPrimitive.id,
    ids: z
      .preprocess(
        val =>
          val === undefined ? undefined : Array.isArray(val) ? val : [val],
        z.array(zPrimitive.id).optional()
      )
      .optional(),

    boolean: z
      .enum(['true', 'false'])
      .transform(val => val === 'true')
      .optional()
      .catch(undefined),
    search: zPrimitive.str.optional().transform(val => val || undefined),
    num: zPrimitive.numCoerce,
  },

  search: zPrimitive.str.optional().transform(val => val || undefined),
  id: zPrimitive.id,

  pagination: z.object({
    page: zPrimitive.numCoerce.int().positive().default(1),
    limit: zPrimitive.numCoerce.int().positive().max(100).default(10),
  }),

  paginationMeta,
  ok: <T extends z.ZodType>(data: T) =>
    z.object({
      success: z.literal(true),
      code: zPrimitive.str.default('OK'),
      data: data,
    }),

  paginated: <T extends z.ZodType>(data: T) =>
    z.object({
      success: z.literal(true),
      code: zPrimitive.str.default('OK'),
      data: data,
      meta: paginationMeta,
    }),
}
