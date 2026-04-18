/**
 * DEPRECATED: This file is kept for backward compatibility only.
 * All schemas have been reorganized into separate, well-organized modules.
 *
 * Please use the following imports instead:
 * - from './common.ts' - for common DTO schemas (RecordId, Timestamps, Audit, etc)
 * - from './response.ts' - for response wrappers and factories
 * - from './primitive.ts' - for primitive validators
 * - from './query.ts' - for query validators
 *
 * Or use the main index export:
 * - from '@/core/validation' - for all organized exports
 */

// Re-export for backward compatibility
export {
	// Common schemas
	zRecordIdDto,
	zMetadataDto,
	zPaginationDto,
	zTimestamps,
	zActors,
	zAuditMeta,
	zSoftDelete,
	zSyncMeta,
	zUserSnippetDto,
	zAuditResolvedDto,
	zPaginationMeta,
	zs,
	type AuditMeta,
	type UserSnippetDto,
	type PaginationMeta,
	type PaginationDto,
} from './common'

export {
	// Response factories
	createSuccessResponseSchema,
	createListResponseSchema,
	createPaginatedResponseSchema,
	createErrorResponseSchema,
	rs,
} from './response'
