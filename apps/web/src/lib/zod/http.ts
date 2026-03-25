import z from 'zod'

import { zPrimitive } from './primitive'

const paginationMeta = z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() })

export type PaginationMeta = z.infer<typeof paginationMeta>

export const zHttp = {
  query: {
    id: zPrimitive.id,
    ids: z
      .preprocess(
        (val) => (val === undefined ? undefined : Array.isArray(val) ? val : [val]),
        z.array(zPrimitive.id).optional(),
      )
      .optional(),

    boolean: z.boolean(),
    search: zPrimitive.str.optional().transform((val) => val || undefined),
    num: zPrimitive.numCoerce,
  },

  pagination: z.object({
    page: zPrimitive.numCoerce.int().positive().default(1),
    limit: zPrimitive.numCoerce.int().positive().max(100).default(10),
  }),

  paginationMeta,
  ok: <T extends z.ZodType>(data: T) =>
    z.object({ success: z.literal(true), code: zPrimitive.str.default('OK'), data: data }),

  paginated: <T extends z.ZodType>(data: T) =>
    z.object({ success: z.literal(true), code: zPrimitive.str.default('OK'), data: data, meta: paginationMeta }),
}
