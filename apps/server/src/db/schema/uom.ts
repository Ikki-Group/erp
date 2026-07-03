import { boolean, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers'

/**
 * Units of Measure Table
 *
 * Global reference table — UOMs are shared across all locations and modules
 * (materials, products, inventory transactions). Not scoped per location.
 *
 * `code`     — normalized, uppercase machine identifier (e.g. 'KG', 'PCS', 'LTR').
 *              Used as the stable reference in application logic, seeding,
 *              and cross-module foreign keys. Never changes after creation.
 *              Enforced uppercase via check constraint to prevent
 *              'kg' vs 'KG' duplicate drift.
 *
 * `name`     — human-readable display label (e.g. 'Kilogram', 'Pieces').
 *              Unique to prevent display ambiguity in UOM pickers.
 *
 * `isSystem` — true for UOMs created by the system seeder (e.g. KG, PCS, LTR).
 *              System UOMs are protected from update and deletion by the
 *              service layer. Mirrors the pattern on rolesTable and usersTable.
 *
 * Deletion protection:
 *   UOMs are referenced by materialsTable (baseUomId) and
 *   materialConversionsTable (uomId) with onDelete: 'restrict'.
 *   A UOM in active use cannot be deleted regardless of isSystem.
 *   isSystem adds a second layer of protection for seeded UOMs
 *   even before any material references them.
 *
 * No DB-level uppercase check: enforcing `code = upper(code)` requires a SQL
 * function call (`upper()`), which Drizzle's query builder has no non-`sql`
 * equivalent for — every other constraint on this table (and everywhere else
 * in the schema) is expressed with `eq`/`gte`/`and`/`or`/etc. instead of raw
 * SQL, so this one invariant is enforced once, at the boundary, via Zod
 * (`zc.code` transform → `.toUpperCase()` in `uom.contract.ts`) rather than
 * carved out as the sole `sql`-based exception in an otherwise sql-free schema.
 */
export const uomsTable = pgTable(
	'uoms',
	{
		...pk,
		code: text('code').notNull(),
		name: text('name').notNull(),
		isSystem: boolean('is_system').notNull().default(false),
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('uoms_code_idx').on(t.code), uniqueIndex('uoms_name_idx').on(t.name)],
)
