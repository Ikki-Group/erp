import { sql } from 'drizzle-orm'
import { boolean, check, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers.ts'

/**
 * Units of Measure Table
 *
 * Global reference table — UOMs are shared across all locations and modules
 * (materials, products, inventory transactions). Not scoped per location.
 *
 * `code`      — normalized, uppercase machine identifier (e.g. 'KG', 'PCS', 'LTR').
 *               Used as the stable reference in application logic, seeding,
 *               and cross-module foreign keys. Never changes after creation.
 *               Enforced uppercase via check constraint to prevent
 *               'kg' vs 'KG' duplicate drift.
 *
 * `name`      — human-readable display label (e.g. 'Kilogram', 'Pieces').
 *               Unique to prevent display ambiguity in UOM pickers.
 *
 * `isBuiltIn` — true for UOMs created by the system seeder (e.g. KG, PCS, LTR).
 *               Built-in UOMs are protected from update and deletion by the
 *               service layer. Mirrors the pattern on rolesTable.
 *
 * Deletion protection:
 *   UOMs are referenced by materialsTable (baseUomId) and
 *   materialConversionsTable (uomId) with onDelete: 'restrict'.
 *   A UOM in active use cannot be deleted regardless of isBuiltIn.
 *   isBuiltIn adds a second layer of protection for seeded UOMs
 *   even before any material references them.
 */
export const uomsTable = pgTable(
	'uoms',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		isBuiltIn: boolean('is_built_in').notNull().default(false),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('uoms_code_idx').on(t.code),
		uniqueIndex('uoms_name_idx').on(t.name),

		// Prevent 'kg' vs 'KG' duplicate drift — code must always be uppercase
		check('uoms_code_uppercase_chk', sql`code = upper(code)`),
	],
)
