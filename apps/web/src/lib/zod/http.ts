import z from 'zod'

import { zId, zNumCoerce, zStr } from './primitive'

export const zPaginationMetaDto = z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() })

export type PaginationMeta = z.infer<typeof zPaginationMetaDto>

export const zQueryId = zId

export const zQueryIds = z.preprocess(
  (val) => (val === undefined ? undefined : Array.isArray(val) ? val : [val]),
  z.array(zId).optional(),
)

export const zQueryBoolean = z.boolean()
export const zQuerySearch = zStr.optional().transform((val) => val === '' ? undefined : val)
export const zQueryNum = zNumCoerce

export const zPaginationDto = z.object({
  page: zNumCoerce.int().positive().default(1),
  limit: zNumCoerce.int().positive().max(100).default(10),
})

export function createSuccessResponseSchema<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), code: zStr.default('OK'), data: data })
}

export function createPaginatedResponseSchema<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), code: zStr.default('OK'), data: data, meta: zPaginationMetaDto })
}
