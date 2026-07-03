/**
 * TTL tiers — pick the one matching the data's write frequency, don't invent
 * a bespoke value per module. Keeps cache behavior predictable and makes it
 * obvious during review whether a new `getOrSet()` call is well-considered.
 *
 * All tiers are cheap on Neon free tier compute: reference/config data is
 * invalidated eagerly on write anyway (see CacheService.deleteFromKeys /
 * deleteByTags), the TTL here is just the worst-case staleness bound if an
 * invalidation is ever missed (bug, direct SQL, etc.) or during the grace
 * period while Neon is unreachable.
 */
export const CACHE_TTL = {
	/** Rarely-changes master/reference data: locations, UOMs, roles, taxes,
	 *  payment methods & providers, sales types, material/product categories. */
	REFERENCE: '1d',
	/** Per-location/tenant configuration: material-location thresholds,
	 *  location-payment-method config, company settings. */
	CONFIG: '1h',
	/** Paginated/filtered list results. Always pair with a `tags` invalidation
	 *  (see entityTag) — DO NOT rely on TTL alone to keep lists correct. */
	LIST: '2m',
	/** High-churn operational reads that still benefit from de-duplicating
	 *  bursts of requests (e.g. dashboard widgets, stock summaries). */
	VOLATILE: '30s',
	/** Security-sensitive lookups (session validation). Cache only to absorb
	 *  request bursts — invalidate explicitly (revoke/logout) rather than
	 *  relying on this TTL to reflect state changes. */
	SECURITY: '10s',
} as const

export type ConfigNamespace =
	| 'location'
	| 'iam.user'
	| 'iam.user.assignment'
	| 'iam.role'
	| 'iam.session'
	| 'product-category'
	| 'product'
	// Material module - new standardized format
	| 'material.category'
	| 'material.uom'
	| 'material.master'
	| 'material.location'
	| 'material.conversion'
	| 'material.query'
	| 'supplier'
	| 'employee'
	| 'finance.account'
	| 'finance.expenditure'
	| 'finance.gl'
	| 'customer'
	| 'company-settings'
	| 'audit-log'
	| 'session'
	| 'inventory.dashboard'
	| 'inventory.summary'
	| 'inventory.stock-transfer'
	| 'inventory.alert'
	| 'recipe'
	| 'sales-type'
	| 'sales.order'
	| 'sales.invoice'
	| 'purchasing.order'
	| 'purchasing.receipt'
	| 'moka.config'
	| 'moka.scrap-history'
	| 'moka.sync-cursor'
	| 'production.work-order'
	| 'hr'
	| 'hr.payroll'
	| 'hr.leave-request'
	| 'analytics'
	| 'payment-method-config'
	| 'payment-method'
	| 'payment'
	| 'uom'
	| 'system.audit'
