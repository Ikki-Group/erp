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

export const zPaginationMetaDto = z.object({
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
})

export type PaginationMeta = z.infer<typeof zPaginationMetaDto>

/**
 * Standard Success Response Factory.
 * Wraps any schema into { success: true, code: string, data: T }
 */
export function createSuccessResponseSchema<T extends z.ZodType>(dataSchema: T) {
	return z.object({ success: z.literal(true), code: z.string().default('OK'), data: dataSchema })
}

/**
 * Standard Paginated Response Factory.
 * Wraps a list into { success: true, code: string, data: T[], meta: { total, ... } }.
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
	return z.object({
		success: z.literal(true),
		code: z.string().default('OK'),
		data: z.array(itemSchema),
		meta: zPaginationMetaDto,
	})
}
