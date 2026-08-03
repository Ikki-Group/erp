/** TTL tiers — pick by data write frequency. Don't invent per-module values. */
export const CACHE_TTL = {
	/** Rarely-changes master data: locations, UOMs, roles, categories. */
	REFERENCE: '1d',
	/** Per-location config: thresholds, payment methods, company settings. */
	CONFIG: '1h',
	/** Paginated lists. Always pair with tag-based invalidation. */
	LIST: '2m',
	/** High-churn reads: dashboard widgets, stock summaries. */
	VOLATILE: '30s',
	/** Security-sensitive: session validation. Invalidate explicitly. */
	SECURITY: '10s',
} as const

/**
 * Cache namespace identifier. Each service registers its own namespace string.
 * No centralized union — namespaces are validated by usage, not by type.
 */
export type ConfigNamespace = string
