import { isNotNull, isNull, not, or } from 'drizzle-orm'
import { boolean, check, index, integer, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'
import { locationsTable } from './location'

/**
 * Sales Types Table
 *
 * Defines the channel or pricing context of a sale (e.g. Dine In, Takeaway,
 * Delivery, Wholesale). Used as the discriminator for per-sales-type pricing
 * in productPricesTable and variantPricesTable.
 *
 * Two tiers:
 *
 *   Global (locationId = null)
 *     — Shared across all locations. Always seeded (isBuiltIn = true).
 *     — Typical examples: 'DINE_IN', 'TAKEAWAY', 'DELIVERY'.
 *     — `code` unique among all global rows (partial unique index).
 *
 *   Per-location (locationId IS NOT NULL)
 *     — Custom sales types created by location operators.
 *     — Always isBuiltIn = false.
 *     — `code` unique within the same location (partial unique index).
 *     — Two locations may share the same code (e.g. both have 'WHOLESALE').
 *
 * `isSystem`  — true for seeder-created global sales types. Protected from
 *               update and deletion by the service layer. Mirrors the pattern
 *               on roles, users, and uoms tables.
 *               Invariant: isSystem = true → locationId IS NULL.
 *               Enforced via check constraint.
 *
 * onDelete: 'restrict' from location — a location with active per-location
 * sales types cannot be deleted. Safer than cascade: productPricesTable and
 * variantPricesTable already restrict deletion of sales types in active use,
 * but unused sales types should not vanish silently either.
 */
export const salesTypesTable = pgTable(
	'sales_types',
	{
		...pk,
		locationId: integer('location_id').references(() => locationsTable.id, {
			onDelete: 'restrict',
		}),
		code: text('code').notNull(),
		name: text('name').notNull(),
		isSystem: boolean('is_system').notNull().default(false),
		...auditBasicColumns,
	},
	(t) => [
		// Global sales types: code unique across all global rows
		uniqueIndex('sales_types_global_code_idx').on(t.code).where(isNull(t.locationId)),

		// Per-location sales types: code unique within a location
		uniqueIndex('sales_types_location_code_idx')
			.on(t.locationId, t.code)
			.where(isNotNull(t.locationId)),

		// Global sales types: name unique across all global rows
		uniqueIndex('sales_types_global_name_idx').on(t.name).where(isNull(t.locationId)),

		// Per-location sales types: name unique within a location
		uniqueIndex('sales_types_location_name_idx')
			.on(t.locationId, t.name)
			.where(isNotNull(t.locationId)),

		index('sales_types_location_idx').on(t.locationId),

		// isSystem types are always global — locationId must be null
		check('sales_types_system_global_chk', or(not(t.isSystem), isNull(t.locationId))!),
	],
)
