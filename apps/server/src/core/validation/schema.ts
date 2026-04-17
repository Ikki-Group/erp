import { z } from 'zod'

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

/** Reusable Audit User Snippet schema. */
export const zUserSnippetDto = z.object({
	id: z.number().int(),
	username: z.string(),
	fullname: z.string(),
})

export type UserSnippetDto = z.infer<typeof zUserSnippetDto>

export const zAuditResolvedDto = z.object({
	creator: zUserSnippetDto.nullable(),
	updater: zUserSnippetDto.nullable(),
})

/**
 * Extends a Zod schema with resolved audit attributes (creator and updater).
 * This makes the schema typesafe for endpoints resolving audit fields.
 */
export function zWithAuditResolved<T extends z.ZodRawShape>(shape: T) {
	return z.object({
		...shape,
		...zAuditResolvedDto.shape,
	})
}

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
