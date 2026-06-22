import { boolean, index, pgEnum, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'

export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])

/**
 * Locations Table
 *
 * Represents a physical operational site (store, warehouse, etc.).
 * Central anchor for LBAC — users are granted roles per location.
 *
 * `code`      — required, normalized/slug identifier (e.g. "JKT-001").
 *               Format: uppercase alphanumeric with dashes (e.g. "JKT-001", "WH-CENTRAL").
 *               Must be globally unique across all locations (active and inactive).
 *               Stable after creation — never changed.
 *
 * `name`      — human-readable display name (e.g. "Jakarta Store 1").
 *               Must be globally unique across all locations (active and inactive).
 *               Can be updated if location is renamed.
 *
 * `type`      — closed enum: 'store' | 'warehouse'. Stable by decision.
 *               Add new values via Drizzle migration if ever needed.
 *
 * `isActive`  — soft-disable. Inactive locations must be rejected by the
 *               service layer for new assignments and session creation.
 *               Does not cascade to existing assignments/sessions —
 *               caller must clean those up explicitly.
 *
 * Unique Constraints:
 * Both `code` and `name` must be globally unique.
 * Once a location is created with a code, that code cannot be reused even after deactivation.
 * This ensures data integrity and prevents confusion in historical records.
 */
export const locationsTable = pgTable(
	'locations',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		type: locationTypeEnum('type').notNull(),
		description: text('description'),
		address: text('address'),
		phone: text('phone'),
		isActive: boolean('is_active').notNull().default(true),
		...auditBasicColumns,
	},
	(t) => [
		// Unique constraints: code and name must be globally unique
		uniqueIndex('locations_code_idx').on(t.code),
		uniqueIndex('locations_name_idx').on(t.name),

		// Query optimization: filter by type and active status (common in UI)
		index('locations_type_active_idx').on(t.type, t.isActive),
	],
)
