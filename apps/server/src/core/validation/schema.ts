import z from 'zod'

import { zDate, zId } from './primitive'

/** Base audit metadata for API visibility. */
export const zMetadataDto = z.object({
  createdBy: zId,
  updatedBy: zId,
  createdAt: zDate,
  updatedAt: zDate,
  deletedAt: zDate.optional().nullable(),
  deletedBy: zId.optional().nullable(),
  syncAt: zDate.optional().nullable(),
})

/** Single Record ID schema. */
export const zRecordIdDto = z.object({ id: zId })

/** Standard Pagination Query Parameters. */
export const zPaginationDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
})

/**
 * Standard Success Response Factory.
 * Wraps any schema into { success: true, code: string, data: T }
 */
export function createSuccessResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({ success: z.literal(true), code: z.string(), data: dataSchema })
}

/**
 * Standard Paginated Response Factory.
 * Wraps a list into { success: true, code: string, data: T[], meta: { total, ... } }.
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    code: z.string(),
    data: z.array(itemSchema),
    meta: z.object({ total: z.number(), page: z.number(), limit: z.number(), totalPages: z.number() }),
  })
}
