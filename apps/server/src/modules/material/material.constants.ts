/**
 * Material module constants
 *
 * All module-level constants centralized for consistency
 * and maintainability.
 */

/**
 * Cache namespaces following `{module}:{feature}` pattern.
 * @example 'material:category', 'material:uom'
 */
export const MATERIAL_CACHE_NS = {
	CATEGORY: 'material:category',
	UOM: 'material:uom',
	MASTER: 'material:master',
	LOCATION: 'material:location',
	CONVERSION: 'material:conversion',
	QUERY: 'material:query',
} as const

/**
 * Standard cache keys used across material services.
 * Use these instead of hardcoded strings for consistency.
 */
export const CACHE_KEY = {
	LIST: 'list',
	COUNT: 'count',
	BY_ID: (id: number | string) => `byId:${id}`,
} as const

/**
 * Default cache TTL values (in seconds)
 */
export const CACHE_TTL = {
	SHORT: 300, // 5 minutes
	MEDIUM: 900, // 15 minutes
	LONG: 3600, // 1 hour
} as const

/**
 * Material type constants
 */
export const MATERIAL_TYPE = {
	RAW: 'raw',
	SEMI: 'semi',
	FINISHED: 'finished',
	PACKAGING: 'packaging',
} as const

/**
 * Error codes for material module
 */
export const ERROR_CODES = {
	// Master
	MATERIAL_NOT_FOUND: 'MATERIAL_NOT_FOUND',
	MATERIAL_CREATE_FAILED: 'MATERIAL_CREATE_FAILED',
	MATERIAL_SKU_ALREADY_EXISTS: 'MATERIAL_SKU_ALREADY_EXISTS',
	MATERIAL_NAME_ALREADY_EXISTS: 'MATERIAL_NAME_ALREADY_EXISTS',

	// Category
	MATERIAL_CATEGORY_NOT_FOUND: 'MATERIAL_CATEGORY_NOT_FOUND',
	MATERIAL_CATEGORY_CREATE_FAILED: 'MATERIAL_CATEGORY_CREATE_FAILED',
	MATERIAL_CATEGORY_NAME_ALREADY_EXISTS: 'MATERIAL_CATEGORY_NAME_ALREADY_EXISTS',

	// UOM
	UOM_NOT_FOUND: 'UOM_NOT_FOUND',
	UOM_CREATE_FAILED: 'UOM_CREATE_FAILED',
	UOM_CODE_ALREADY_EXISTS: 'UOM_CODE_ALREADY_EXISTS',

	// Location
	MATERIAL_LOCATION_NOT_FOUND: 'MATERIAL_LOCATION_NOT_FOUND',
	MATERIAL_LOCATION_ASSIGN_FAILED: 'MATERIAL_LOCATION_ASSIGN_FAILED',
	MATERIAL_NOT_ASSIGNED_TO_LOCATION: 'MATERIAL_NOT_ASSIGNED_TO_LOCATION',
	MATERIAL_LOCATION_ALREADY_ASSIGNED: 'MATERIAL_LOCATION_ALREADY_ASSIGNED',

	// Conversion
	MATERIAL_CONVERSION_NOT_FOUND: 'MATERIAL_CONVERSION_NOT_FOUND',
	MATERIAL_CONVERSION_CREATE_FAILED: 'MATERIAL_CONVERSION_CREATE_FAILED',
	MATERIAL_CONVERSION_INVALID_FACTOR: 'MATERIAL_CONVERSION_INVALID_FACTOR',
	MATERIAL_CONVERSION_UOM_ALREADY_EXISTS: 'MATERIAL_CONVERSION_UOM_ALREADY_EXISTS',
} as const
