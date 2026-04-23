/**
 * IAM Module Constants
 * Centralized constants for cache keys, system roles, and configurations
 */

/**
 * System role IDs (hardcoded in DB, immutable)
 */
export const SYSTEM_ROLES = {
	SUPERADMIN_ID: 1,
} as const

/**
 * Cache key strategies
 * Structure: {domain}:{operation}:{id?}
 */
export const IAM_CACHE_KEYS = {
	// User cache
	USER_LIST: 'iam:user:list',
	USER_COUNT: 'iam:user:count',
	USER_DETAIL: (id: number) => `iam:user:${id}`,

	// Role cache
	ROLE_LIST: 'iam:role:list',
	ROLE_COUNT: 'iam:role:count',
	ROLE_DETAIL: (id: number) => `iam:role:${id}`,

	// Assignment cache (lightweight, usually no cache needed)
	ASSIGNMENT_BY_USER: (userId: number) => `iam:assignment:user:${userId}`,
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

/**
 * User assignment constants
 */
export const USER_ASSIGNMENT = {
	SUPERADMIN_ROLE_ID: SYSTEM_ROLES.SUPERADMIN_ID,
} as const
