import { z } from 'zod'

import { zDate, zId, zp } from './primitive'

const zTimestamps = z.object({
	createdAt: zp.date,
	updatedAt: zp.date,
})

const zActors = z.object({
	createdBy: zp.id,
	updatedBy: zp.id,
})

const zSoftDelete = z.object({
	deletedBy: zId.nullable(),
	deletedAt: zp.date.nullable(),
})

const zSyncMeta = z.object({
	syncAt: zDate.nullable(),
})

const zAuditMeta = z.object({
	...zTimestamps.shape,
	...zActors.shape,
})

export type AuditMeta = z.infer<typeof zAuditMeta>

/** Reusable Audit User Snippet schema. */
export const zUserSnippetDto = z.object({
	id: z.number().int(),
	username: z.string(),
	fullname: z.string(),
})

export type UserSnippetDto = z.infer<typeof zUserSnippetDto>

export const zs = {
	timestamps: zTimestamps,
	actors: zActors,
	softDelete: zSoftDelete,
	syncMeta: zSyncMeta,
	auditMeta: zAuditMeta,
	userSnippet: zUserSnippetDto,
}

/** Base audit metadata for API visibility. */
export const zMetadataDto = z.object({
	createdBy: zp.id,
	createdAt: zp.date,
	updatedBy: zp.id,
	updatedAt: zp.date,
	deletedBy: zId.nullable(),
	deletedAt: zp.date.nullable(),
	syncAt: zDate.optional().nullable(),
})

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
