/**
 * System role IDs (hardcoded in DB, immutable)
 */
export const SYSTEM_ROLES = {
	SUPERADMIN_ID: 1,
} as const

/**
 * IAM configuration
 */
export const IAM_CONFIG = {
	// Placeholder ID used for superadmin dynamic assignments
	SUPERADMIN_PLACEHOLDER_ID: 999999,

	// Cache TTL (in seconds) - optional, if using explicit TTL
	CACHE_TTL_SHORT: 300, // 5 minutes
	CACHE_TTL_LONG: 3600, // 1 hour
} as const
