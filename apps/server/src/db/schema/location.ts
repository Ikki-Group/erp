import { boolean, pgEnum, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers.ts'

export const locationTypeEnum = pgEnum('location_type', ['store', 'warehouse'])

/**
 * Locations Table
 *
 * Represents a physical operational site (store, warehouse, etc.).
 * Central anchor for LBAC — users are granted roles per location.
 *
 * `code`      — required, normalized/slug identifier (e.g. "JKT-001").
 *               Unique among active locations. Stable after creation.
 *
 * `name`      — human-readable display name. Unique among active locations.
 *               Both `code` and `name` use partial unique indexes scoped to
 *               `is_active = TRUE` so decommissioned locations don't block
 *               reuse of the same code/name for a new site.
 *
 * `type`      — closed enum: 'store' | 'warehouse'. Stable by decision.
 *               Add new values via Drizzle migration if ever needed.
 * `isActive`  — soft-disable. Inactive locations must be rejected by the
 *               service layer for new assignments and session creation.
 *               Does not cascade to existing assignments/sessions —
 *               caller must clean those up explicitly.
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
		// Partial unique indexes: decommissioned locations don't block reuse
		// of the same code/name for a new site.
		uniqueIndex('locations_code_active_idx').on(t.code),
		uniqueIndex('locations_name_active_idx').on(t.name),
	],
)
