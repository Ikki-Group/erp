import { pgTable, pgEnum, varchar, numeric, integer, index, uniqueIndex } from 'drizzle-orm/pg-core'

import { pk, auditBasicColumns } from './_helpers.ts'
import { locations } from './core.ts'
import { uoms } from './uom.ts'

// ─── Enums ───

export const materialTypeEnum = pgEnum('material_type', ['raw', 'semi_finished'])

// ─── Material Categories ───

export const materialCategories = pgTable('material_categories', {
	...pk,
	name: varchar('name', { length: 255 }).notNull(),
	...auditBasicColumns,
})

// ─── Materials ───

export const materials = pgTable(
	'materials',
	{
		...pk,
		code: varchar('code', { length: 50 }).notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		type: materialTypeEnum('type').notNull(),
		categoryId: integer('category_id').references(() => materialCategories.id, {
			onDelete: 'set null',
		}),
		baseUomId: integer('base_uom_id')
			.notNull()
			.references(() => uoms.id, { onDelete: 'restrict' }),
		defaultPurchaseUomId: integer('default_purchase_uom_id').references(() => uoms.id, {
			onDelete: 'set null',
		}),
		defaultStockUomId: integer('default_stock_uom_id').references(() => uoms.id, {
			onDelete: 'set null',
		}),
		defaultRecipeUomId: integer('default_recipe_uom_id').references(() => uoms.id, {
			onDelete: 'set null',
		}),
		minStock: numeric('min_stock', { precision: 18, scale: 6 }),
		isActive: integer('is_active').notNull().default(1),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('materials_code_uniq').on(t.code),
		index('materials_category_id_idx').on(t.categoryId),
		index('materials_base_uom_id_idx').on(t.baseUomId),
		index('materials_default_purchase_uom_id_idx').on(t.defaultPurchaseUomId),
		index('materials_default_stock_uom_id_idx').on(t.defaultStockUomId),
		index('materials_default_recipe_uom_id_idx').on(t.defaultRecipeUomId),
	],
)

// ─── Material Locations ───

export const materialLocations = pgTable(
	'material_locations',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'cascade' }),
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'cascade' }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('material_locations_material_location_uniq').on(t.materialId, t.locationId),
		index('material_locations_material_id_idx').on(t.materialId),
		index('material_locations_location_id_idx').on(t.locationId),
	],
)
