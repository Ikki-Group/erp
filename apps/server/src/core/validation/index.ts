/**
 * Validation module - organized for excellent DX.
 *
 * Usage:
 * - Primitives: import { zStr, zId, zEmail, zp } from '@/core/validation'
 * - Query: import { zQuerySearch, zQueryPagination, zq } from '@/core/validation'
 * - Common: import { zRecordIdDto, zMetadataDto, zPaginationDto, zs } from '@/core/validation'
 * - Response: import { createSuccessResponseSchema, createPaginatedResponseSchema, rs } from '@/core/validation'
 */

// ============================================================================
// Primitives (String, Numeric, Temporal, Boolean, Auth, Special, Sort)
// ============================================================================

export {
	// String
	zStr,
	zStrNullable,
	// Numeric
	zNum,
	zNumCoerce,
	zId,
	// Temporal
	zDate,
	// Boolean
	zBool,
	// Auth
	zEmail,
	zPassword,
	zUsername,
	// Special
	zUuid,
	zCodeUpper,
	zDecimal,
	// Sort
	zSortOrder,
	// Namespace
	zp,
} from './primitive'

// ============================================================================
// Query Validators (ID, String, Boolean, Pagination)
// ============================================================================

export {
	// IDs
	zQueryId,
	zQueryIds,
	// Strings
	zQuerySearch,
	// Booleans
	zQueryBoolean,
	// Pagination
	zQueryPagination,
	// Namespace
	zq,
} from './query'

// ============================================================================
// Common DTOs (RecordId, Timestamps, Audit, Pagination, Metadata)
// ============================================================================

export {
	// Record identifiers
	zRecordId,
	zRecordIdDto,
	// Timestamps
	zTimestamps,
	// Audit
	zActors,
	zAuditMeta,
	zUserSnippetDto,
	zAuditResolvedDto,
	// Soft Delete
	zSoftDelete,
	// Sync
	zSyncMeta,
	// Pagination
	zPaginationMeta,
	zPaginationDto,
	// Metadata (composite)
	zMetadataDto,
	// Namespace
	zs,
	// Types
	type AuditMeta,
	type UserSnippetDto,
	type PaginationMeta,
	type PaginationDto,
} from './common'

// ============================================================================
// Response Factories (Success, List, Paginated, Error, Schema Helpers)
// ============================================================================

export {
	// Factories
	createSuccessResponseSchema,
	createListResponseSchema,
	createPaginatedResponseSchema,
	createErrorResponseSchema,
	// Helpers
	zWithAuditResolved,
	// Namespace
	rs,
} from './response'
