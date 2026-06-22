import { boolean, index, pgEnum, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

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
 *               Unique among active locations only (partial unique index).
 *               Stable after creation — never changed.
 *
 * `name`      — human-readable display name (e.g. "Jakarta Store 1").
 *               Unique among active locations only (partial unique index).
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
 * Partial Unique Indexes:
 * Both `code` and `name` use partial unique indexes (WHERE is_active = TRUE)
 * so decommissioned locations don't block reuse of the same code/name.
 *
 * Example: Close "JKT-001" (set isActive=false), then open new "JKT-001" (isActive=true).
 * The new active location can reuse the code because uniqueness only applies to active rows.
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
		// Partial unique indexes: only active locations must have unique code/name
		uniqueIndex('locations_code_active_idx')
			.on(t.code)
			.where(sql`${t.isActive} = true`),
		uniqueIndex('locations_name_active_idx')
			.on(t.name)
			.where(sql`${t.isActive} = true`),

		// Query optimization: filter by type and active status (common in UI)
		index('locations_type_active_idx').on(t.type, t.isActive),
	],
)
