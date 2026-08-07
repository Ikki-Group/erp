import { pgTable, varchar, numeric, integer, check, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { pk, auditBasicColumns } from './_helpers.ts'

// ─── Units of Measure ───

export const uoms = pgTable(
	'uoms',
	{
		...pk,
		code: varchar('code', { length: 50 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		category: varchar('category', { length: 50 }).notNull(),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('uoms_code_uniq').on(t.code),
		check('uoms_category_chk', sql`${t.category} IN ('weight', 'volume', 'quantity', 'length')`),
	],
)

// ─── UoM Conversions ───

export const uomConversions = pgTable(
	'uom_conversions',
	{
		...pk,
		fromUomId: integer('from_uom_id').notNull().references(() => uoms.id, { onDelete: 'restrict' }),
		toUomId: integer('to_uom_id').notNull().references(() => uoms.id, { onDelete: 'restrict' }),
		factor: numeric('factor', { precision: 18, scale: 6 }).notNull(),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('uom_conversions_from_to_uniq').on(t.fromUomId, t.toUomId),
		index('uom_conversions_from_uom_id_idx').on(t.fromUomId),
		index('uom_conversions_to_uom_id_idx').on(t.toUomId),
		check('uom_conversions_factor_positive_chk', sql`${t.factor} > 0`),
	],
)
