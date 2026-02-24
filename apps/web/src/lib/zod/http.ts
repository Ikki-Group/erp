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
  boolean: z.boolean(),
  search: zPrimitive.str.optional().transform((val) => val || undefined),

  id: zPrimitive.num.positive(),
  idOpt: zPrimitive.num.positive().optional(),

  pagination: z.object({
    page: zPrimitive.num.positive().default(1),
    limit: zPrimitive.num.positive().default(10),
  }),

  paginationMeta,
  ok: <T extends z.ZodType>(data: T) =>
    z.object({
      success: z.literal(true),
      code: zPrimitive.str,
      data: data,
    }),

  paginated: <T extends z.ZodType>(data: T) =>
    z.object({
      success: z.literal(true),
      code: zPrimitive.str,
      data: data,
      meta: paginationMeta,
    }),
}
