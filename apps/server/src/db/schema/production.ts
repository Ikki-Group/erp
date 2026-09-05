import { sql } from 'drizzle-orm'
import {
	pgTable,
	pgEnum,
	varchar,
	numeric,
	integer,
	timestamp,
	check,
	index,
	uniqueIndex,
	boolean,
} from 'drizzle-orm/pg-core'

import { pk, auditBasicColumns } from './_helpers.ts'
import { locations } from './core.ts'
import { users } from './iam.ts'
import { materials } from './material.ts'
import { uoms } from './uom.ts'

// ─── Enums ───

export const productionOrderStatusEnum = pgEnum('production_order_status', [
	'draft',
	'completed',
	'cancelled',
])

// ─── Production Recipes ───

export const productionRecipes = pgTable(
	'production_recipes',
	{
		...pk,
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		name: varchar('name', { length: 255 }).notNull(),
		yieldQty: numeric('yield_qty', { precision: 18, scale: 6 }).notNull(),
		yieldUomId: integer('yield_uom_id')
			.notNull()
			.references(() => uoms.id, { onDelete: 'restrict' }),
		isActive: boolean('is_active').notNull().default(true),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('production_recipes_material_active_uniq')
			.on(t.materialId)
			.where(sql`${t.isActive} = true`),
		index('production_recipes_material_id_idx').on(t.materialId),
		index('production_recipes_yield_uom_id_idx').on(t.yieldUomId),
	],
)

// ─── Production Recipe Lines ───

export const productionRecipeLines = pgTable(
	'production_recipe_lines',
	{
		...pk,
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => productionRecipes.id, { onDelete: 'cascade' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
		uomId: integer('uom_id')
			.notNull()
			.references(() => uoms.id, { onDelete: 'restrict' }),
	},
	(t) => [
		check('production_recipe_lines_qty_positive_chk', sql`${t.quantity} > 0`),
		index('production_recipe_lines_recipe_id_idx').on(t.recipeId),
		index('production_recipe_lines_material_id_idx').on(t.materialId),
		index('production_recipe_lines_uom_id_idx').on(t.uomId),
	],
)

// ─── Production Orders ───

export const productionOrders = pgTable(
	'production_orders',
	{
		...pk,
		productionNo: varchar('production_no', { length: 100 }).notNull(),
		locationId: integer('location_id')
			.notNull()
			.references(() => locations.id, { onDelete: 'restrict' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materials.id, { onDelete: 'restrict' }),
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => productionRecipes.id, { onDelete: 'restrict' }),
		status: productionOrderStatusEnum('status').notNull().default('draft'),
		plannedQty: numeric('planned_qty', { precision: 18, scale: 6 }).notNull(),
		actualQty: numeric('actual_qty', { precision: 18, scale: 6 }),
		notes: varchar('notes', { length: 1000 }),
		producedBy: integer('produced_by').references(() => users.id, { onDelete: 'set null' }),
		completedAt: timestamp('completed_at', { withTimezone: true }),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('production_orders_production_no_uniq').on(t.productionNo),
		check('production_orders_planned_qty_positive_chk', sql`${t.plannedQty} > 0`),
		index('production_orders_location_id_idx').on(t.locationId),
		index('production_orders_material_id_idx').on(t.materialId),
		index('production_orders_recipe_id_idx').on(t.recipeId),
		index('production_orders_produced_by_idx').on(t.producedBy),
	],
)
