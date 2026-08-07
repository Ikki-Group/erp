import { pgTable, varchar, numeric, integer, check, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { pk, auditBasicColumns } from './_helpers.ts'
import { menuItems } from './menu.ts'
import { materials } from './material.ts'
import { uoms } from './uom.ts'

// ─── Recipes ───

export const recipes = pgTable(
	'recipes',
	{
		...pk,
		menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).notNull(),
		yieldQty: numeric('yield_qty', { precision: 18, scale: 6 }).notNull(),
		isActive: integer('is_active').notNull().default(1),
		...auditBasicColumns,
	},
	(t) => [
		uniqueIndex('recipes_menu_item_active_uniq').on(t.menuItemId).where(sql`${t.isActive} = 1`),
		index('recipes_menu_item_id_idx').on(t.menuItemId),
	],
)

// ─── Recipe Lines ───

export const recipeLines = pgTable(
	'recipe_lines',
	{
		...pk,
		recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
		materialId: integer('material_id').notNull().references(() => materials.id, { onDelete: 'restrict' }),
		quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull(),
		uomId: integer('uom_id').notNull().references(() => uoms.id, { onDelete: 'restrict' }),
	},
	(t) => [
		check('recipe_lines_qty_positive_chk', sql`${t.quantity} > 0`),
		index('recipe_lines_recipe_id_idx').on(t.recipeId),
		index('recipe_lines_material_id_idx').on(t.materialId),
		index('recipe_lines_uom_id_idx').on(t.uomId),
	],
)
