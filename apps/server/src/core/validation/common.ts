import { z } from 'zod'

import { zDate, zId } from './primitive'

export const zRecordId = z.object({ id: zId })
export const zRecordIdDto = zRecordId

export const zTimestamps = z.object({
	createdAt: zDate,
	updatedAt: zDate,
})

export const zActors = z.object({
	createdBy: zId,
	updatedBy: zId,
})

export const zAuditMeta = z.object({
	...zTimestamps.shape,
	...zActors.shape,
})

export type AuditMeta = z.infer<typeof zAuditMeta>

export const zSoftDelete = z.object({
	deletedBy: zId.nullable(),
	deletedAt: zDate.nullable(),
})

export const zSyncMeta = z.object({
	syncAt: zDate.nullable(),
})

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

/** Standard metadata for entity DTO responses. Includes timestamps and audit actors. */
export const zMetadataDto = z.object({
	...zAuditMeta.shape,
})

export const zPaginationMeta = z.object({
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
})

export type PaginationMeta = z.infer<typeof zPaginationMeta>

/** Pagination DTO for query responses. */
export const zPaginationDto = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
})

export type PaginationDto = z.infer<typeof zPaginationDto>

/** Grouped common schemas namespace - for convenient bulk access. */
export const zs = {
	// Record identifiers
	RecordId: zRecordId,

	// Timestamps
	Timestamps: zTimestamps,

	// Audit
	Actors: zActors,
	AuditMeta: zAuditMeta,
	AuditResolved: zAuditResolvedDto,

	// Soft Delete
	SoftDelete: zSoftDelete,

	// Sync
	SyncMeta: zSyncMeta,

	// User Snippet
	UserSnippet: zUserSnippetDto,

	// Pagination
	PaginationMeta: zPaginationMeta,
	Pagination: zPaginationDto,

	// Metadata (composite)
	Metadata: zMetadataDto,
}
