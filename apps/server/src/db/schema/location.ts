import { boolean, index, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'

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
 *               Unique among active locations (enforced via partial index in migration).
 *               Stable after creation — never changed.
 *
 * `name`      — human-readable display name (e.g. "Jakarta Store 1").
 *               Unique among active locations (enforced via partial index in migration).
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
 * IMPORTANT - Partial Unique Indexes (NOT visible in Drizzle schema):
 * Drizzle ORM does not support partial indexes with WHERE clause.
 * These indexes are created manually via migration:
 *
 *   CREATE UNIQUE INDEX locations_code_active_idx
 *     ON locations(code) WHERE is_active = TRUE;
 *
 *   CREATE UNIQUE INDEX locations_name_active_idx
 *     ON locations(name) WHERE is_active = TRUE;
 *
 * This allows reuse of code/name after location deactivation.
 * Example: Close "JKT-001" (set isActive=false), then open new "JKT-001" (isActive=true).
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
		// Query optimization: filter by type and active status (common in UI)
		index('locations_type_active_idx').on(t.type, t.isActive),

		// NOTE: Unique indexes on code/name are partial (WHERE is_active = TRUE)
		// and created manually via migration (see comment above).
		// Do NOT add uniqueIndex() here — it would create non-partial constraint.
	],
)
