/**
 * Standardized cache key constants for service layer caching.
 * Use these instead of inline string literals for consistency.
 */
export const CACHE_KEY = {
	LIST: 'list' as const,
	COUNT: 'count' as const,
	BY_ID: (id: number | string) => `byId:${id}`,
} as const
