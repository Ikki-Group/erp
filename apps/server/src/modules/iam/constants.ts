/**
 * System role codes — stable machine identifiers used in seeding and lookups.
 * These match the `code` column in the roles table.
 */
export const SYSTEM_ROLE_CODES = {
	OWNER: 'OWNER',
	MANAGER: 'MANAGER',
	CASHIER: 'CASHIER',
	STAFF: 'STAFF',
} as const

/**
 * System role definitions for seeding.
 *
 * Each role has a fixed scope and default permission set.
 * The OWNER role uses `['*']` (wildcard) meaning all permissions.
 */
export const SYSTEM_ROLE_DEFINITIONS = [
	{
		code: SYSTEM_ROLE_CODES.OWNER,
		name: 'Owner',
		description: 'Business owner — full access to all locations and features',
		scope: 'global' as const,
		permissions: ['*'],
		isSystem: true,
	},
	{
		code: SYSTEM_ROLE_CODES.MANAGER,
		name: 'Manager',
		description: 'Location manager — manages assigned location operations',
		scope: 'location' as const,
		permissions: [],
		isSystem: true,
	},
	{
		code: SYSTEM_ROLE_CODES.CASHIER,
		name: 'Cashier',
		description: 'Cashier — handles sales transactions at assigned location',
		scope: 'location' as const,
		permissions: [],
		isSystem: true,
	},
	{
		code: SYSTEM_ROLE_CODES.STAFF,
		name: 'Staff',
		description: 'General staff — basic operational access at assigned location',
		scope: 'location' as const,
		permissions: [],
		isSystem: true,
	},
] as const
