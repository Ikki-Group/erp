import { index, integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { materialTypeEnum } from './_helpers'
import { auditBasicColumns, pk } from './_helpers.ts'
import { locationsTable } from './location'
import { uomsTable } from './uom'

export const materialCategoriesTable = pgTable(
	'material_categories',
	{
		...pk,
		name: text().notNull(),
		description: text(),
		...auditBasicColumns,
	},
	(t) => [uniqueIndex('material_categories_name_idx').on(t.name)],
)

export const materialsTable = pgTable(
	'materials',
	{
		...pk,
		name: text().notNull(),
		description: text(),
		sku: text().notNull(),
		type: materialTypeEnum().notNull(),
		categoryId: integer().references(() => materialCategoriesTable.id, { onDelete: 'set null' }),
		baseUomId: integer()
			.notNull()
			.references(() => uomsTable.id, { onDelete: 'restrict' }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('materials_name_idx').on(t.name),
		uniqueIndex('materials_sku_idx').on(t.sku),
		index('materials_category_idx').on(t.categoryId),
		index('materials_base_uom_idx').on(t.baseUomId),
	],
)

export const materialConversionsTable = pgTable(
	'material_conversions',
	{
		...pk,
		materialId: integer()
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'cascade' }),
		uomId: integer()
			.notNull()
			.references(() => uomsTable.id, { onDelete: 'restrict' }),
		toBaseFactor: numeric({ precision: 18, scale: 6 }).notNull(),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('material_conversions_material_uom_idx').on(t.materialId, t.uomId),
		index('material_conversions_uom_idx').on(t.uomId),
	],
)

export const materialLocationsTable = pgTable(
	'material_locations',
	{
		...pk,
		materialId: integer()
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'cascade' }),
		locationId: integer()
			.notNull()
			.references(() => locationsTable.id, { onDelete: 'restrict' }),

		// Per-location configuration
		minStock: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		maxStock: numeric({ precision: 18, scale: 4 }),
		reorderPoint: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

		// Current stock snapshot (maintained by inventory module)
		currentQty: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		currentAvgCost: numeric({ precision: 18, scale: 4 }).notNull().default('0'),
		currentValue: numeric({ precision: 18, scale: 4 }).notNull().default('0'),

		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('material_locations_material_location_idx').on(t.materialId, t.locationId),
		index('material_locations_location_idx').on(t.locationId),
	],
)
