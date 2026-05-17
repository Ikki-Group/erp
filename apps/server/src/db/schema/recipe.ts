import { sql } from 'drizzle-orm'
import {
	boolean,
	check,
	index,
	integer,
	numeric,
	pgTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/pg-core'

import { auditBasicColumns, pk } from './_helpers.ts'
import { materialsTable } from './material.ts'
import { productsTable, productVariantsTable } from './product.ts'
import { uomsTable } from './uom.ts'

/**
 * Recipes Table
 *
 * Defines the bill of materials (BOM) for producing a target output.
 * A recipe belongs to exactly one target — either a material, a product,
 * or a product variant (XOR). Enforced via check constraint.
 *
 * Target semantics:
 *   materialId        — recipe produces a raw/semi/packaging material.
 *                       targetUomId must match the material's baseUomId
 *                       (enforced by the service layer).
 *
 *   productId         — recipe produces a product (no-variant or default).
 *                       Used as fallback when no variant-level recipe exists.
 *                       targetUomId is typically 'PCS' or a serving UOM.
 *
 *   productVariantId  — variant-specific recipe. Takes priority over the
 *                       parent product-level recipe when both exist.
 *                       Lookup order: variant recipe → product recipe → none.
 *                       targetUomId is typically 'PCS' or a serving UOM.
 *
 * `targetQty`   — expected yield per production run, expressed in `targetUomId`.
 *                 Used as the denominator for per-unit cost calculation:
 *                 unit_cost = total_ingredient_cost / target_qty.
 *                 Must be strictly positive.
 *
 * `targetUomId` — UOM of the yield quantity. Always explicit — never implicit.
 *                 For material targets: must match material.baseUomId (service layer).
 *                 For product/variant targets: operator-defined (e.g. 'PCS', 'PORTION').
 *
 * `name`        — optional human-readable label for operator UX
 *                 (e.g. 'Standard', 'Large Batch'). Useful when debugging
 *                 or displaying recipe lists in the admin panel.
 *
 * `isActive`    — retire a recipe without hard-deletion. Inactive recipes
 *                 must not be used in new production orders but remain for
 *                 historical cost recalculation integrity.
 *
 * One recipe per target — enforced via three partial unique indexes,
 * one per FK column, each scoped to non-null rows.
 */
export const recipesTable = pgTable(
	'recipes',
	{
		...pk,
		materialId: integer('material_id').references(() => materialsTable.id, {
			onDelete: 'cascade',
		}),
		productId: integer('product_id').references(() => productsTable.id, {
			onDelete: 'cascade',
		}),
		productVariantId: integer('product_variant_id').references(() => productVariantsTable.id, {
			onDelete: 'cascade',
		}),

		name: text('name'),

		targetQty: numeric('target_qty', { precision: 18, scale: 6 }).notNull().default('1'),
		targetUomId: integer('target_uom_id')
			.notNull()
			.references(() => uomsTable.id, { onDelete: 'restrict' }),

		instructions: text('instructions'),
		isActive: boolean('is_active').notNull().default(true),
		...auditBasicColumns,
	},
	(t) => [
		// One recipe per material
		uniqueIndex('recipes_material_idx')
			.on(t.materialId)
			.where(sql`material_id IS NOT NULL`),

		// One recipe per product
		uniqueIndex('recipes_product_idx')
			.on(t.productId)
			.where(sql`product_id IS NOT NULL`),

		// One recipe per variant
		uniqueIndex('recipes_variant_idx')
			.on(t.productVariantId)
			.where(sql`product_variant_id IS NOT NULL`),

		// XOR: exactly one target FK must be set — never zero, never more than one
		check(
			'recipes_target_xor_chk',
			sql`(
				(CASE WHEN material_id IS NOT NULL THEN 1 ELSE 0 END) +
				(CASE WHEN product_id IS NOT NULL THEN 1 ELSE 0 END) +
				(CASE WHEN product_variant_id IS NOT NULL THEN 1 ELSE 0 END)
			) = 1`,
		),

		// Yield must be strictly positive — zero or negative has no physical meaning
		check('recipes_target_qty_chk', sql`target_qty > 0`),
	],
)

/**
 * Recipe Items Table
 *
 * Individual ingredient rows belonging to a recipe (bill of materials lines).
 * Each row specifies one material, the required quantity, and the UOM.
 *
 * `qty`             — amount of the material required per production run.
 *                     Expressed in `uomId`. Must be convertible to the
 *                     material's baseUomId via materialConversionsTable.
 *                     Must be strictly positive.
 *
 * `uomId`           — UOM for this ingredient line. May differ from the
 *                     material's baseUomId (e.g. recipe uses 'gram', base is 'kg').
 *                     Conversion is resolved at cost calculation time via
 *                     materialConversionsTable. onDelete: 'restrict' — cannot
 *                     delete a UOM in active use by a recipe ingredient.
 *
 * `scrapPercentage` — expected loss/waste during preparation (0–99.99%).
 *                     Effective quantity = qty × (1 + scrapPercentage / 100).
 *                     Used in cost calculation to account for trim loss, evaporation, etc.
 *                     Range: [0, 100) — 100% loss is nonsensical.
 *
 * `sortOrder`       — display/execution order of ingredients within the recipe.
 *                     Integer, not numeric — sort position is always a whole number.
 *
 * `notes`           — per-ingredient preparation note (e.g. "finely chopped",
 *                     "room temperature"). For display only, not used in calculation.
 *
 * Unique on (recipeId, materialId) — the same material cannot appear twice
 * in one recipe. Duplicate rows are almost certainly a data entry error and
 * would silently double-count ingredient cost.
 *
 * onDelete: 'cascade' from recipe — items are owned by their recipe.
 * onDelete: 'restrict' from material — cannot delete a material in active use.
 */
export const recipeItemsTable = pgTable(
	'recipe_items',
	{
		...pk,
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => recipesTable.id, { onDelete: 'cascade' }),
		materialId: integer('material_id')
			.notNull()
			.references(() => materialsTable.id, { onDelete: 'restrict' }),
		qty: numeric('qty', { precision: 18, scale: 6 }).notNull(),
		uomId: integer('uom_id')
			.notNull()
			.references(() => uomsTable.id, { onDelete: 'restrict' }),
		scrapPercentage: numeric('scrap_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
		sortOrder: integer('sort_order').notNull().default(0),
		notes: text('notes'),
		...auditBasicColumns,
	},
	(t) => [
		// No duplicate ingredients within the same recipe
		uniqueIndex('recipe_items_recipe_material_idx').on(t.recipeId, t.materialId),

		// Hot path: fetch all items for a recipe
		index('recipe_items_recipe_idx').on(t.recipeId),

		// Reverse lookup: which recipes use this material? (impact analysis)
		index('recipe_items_material_idx').on(t.materialId),

		// qty must be strictly positive
		check('recipe_items_qty_chk', sql`qty > 0`),

		// scrapPercentage: [0, 100) — 100% loss is nonsensical
		check('recipe_items_scrap_pct_chk', sql`scrap_percentage >= 0 AND scrap_percentage < 100`),
	],
)
