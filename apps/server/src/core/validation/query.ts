import { z } from 'zod'

import { zId } from './primitive'

// ============================================================================
// Query ID Validators
// ============================================================================

export const zQueryId = zId
export const zQueryIds = z
	.array(zQueryId)
	.or(zQueryId)
	.transform((val) => (Array.isArray(val) ? val : [val]))

// ============================================================================
// Query String Validators
// ============================================================================

/** Search query string validator. */
export const zQuerySearch = z.string().trim().optional()

// ============================================================================
// Query Boolean Validators
// ============================================================================

export const zQueryBoolean = z
	.string()
	.transform((val) => val === 'true')
	.or(z.boolean())
	.optional()

// ============================================================================
// Query Pagination
// ============================================================================

export const zQueryPagination = z.object({
	page: z.coerce.number().int().positive().default(1).catch(1),
	limit: z.coerce.number().int().positive().max(100).default(10).catch(10),
})

// ============================================================================
// Grouped Query Validators Namespace
// ============================================================================

/** Grouped query validators namespace - for convenient bulk access. */
export const zq = {
	// IDs
	id: zQueryId,
	ids: zQueryIds,

	// Strings
	search: zQuerySearch,

	// Booleans
	boolean: zQueryBoolean,

	// Pagination
	pagination: zQueryPagination,
}
