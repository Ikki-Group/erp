import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { metadata, pk } from './_helpers'
import { materialsTable, uomsTable } from './material'
import { productsTable, productVariantsTable } from './product'

// ─── Recipes ──────────────────────────────────────────────────────────────────
// A recipe defines how to make a target item.
// The target can be ONE OF:
// 1. materialId (type 'semi')
// 2. productId (base recipe inherited by all variants)
// 3. productVariantId (specific recipe overriding the product-level recipe)
// We enforce that exactly one of (materialId, productId, productVariantId) is not null.

export const recipesTable = pgTable(
  'recipes',
  {
    ...pk,
    materialId: integer().references(() => materialsTable.id, { onDelete: 'cascade' }),
    productId: integer().references(() => productsTable.id, { onDelete: 'cascade' }),
    productVariantId: integer().references(() => productVariantsTable.id, { onDelete: 'cascade' }),

    // The amount produced by this recipe (expected yield)
    targetQty: numeric({ precision: 18, scale: 4 }).notNull().default('1'),
    isActive: boolean().notNull().default(true),

    // Optional preparation instructions for the whole recipe
    instructions: text(),

    ...metadata,
  },
  (t) => [
    // Ensure a material can have at most one recipe
    uniqueIndex('recipes_material_idx')
      .on(t.materialId)
      .where(sql`${t.materialId} IS NOT NULL`),
    // Ensure a product can have at most one base recipe
    uniqueIndex('recipes_product_idx')
      .on(t.productId)
      .where(sql`${t.productId} IS NOT NULL`),
    // Ensure a product variant can have at most one recipe
    uniqueIndex('recipes_product_variant_idx')
      .on(t.productVariantId)
      .where(sql`${t.productVariantId} IS NOT NULL`),
    // Check constraint: exactly one target must be set
    check('recipe_target_chk', sql`num_nonnulls("materialId", "productId", "productVariantId") = 1`),
  ],
)

// ─── Recipe Items ─────────────────────────────────────────────────────────────
// The ingredients/components required for a recipe.

export const recipeItemsTable = pgTable(
  'recipe_items',
  {
    ...pk,
    recipeId: integer()
      .notNull()
      .references(() => recipesTable.id, { onDelete: 'cascade' }),
    // The component material required
    materialId: integer()
      .notNull()
      .references(() => materialsTable.id, { onDelete: 'restrict' }),

    // Quantity of the material needed
    qty: numeric({ precision: 18, scale: 4 }).notNull(),
    // Allowed percentage of loss/scrap (e.g., 5% loss during preparation), useful for cost calculation
    scrapPercentage: numeric({ precision: 5, scale: 2 }).notNull().default('0'),
    // UOM used for this ingredient in the recipe (should match baseUom or be convertible)
    uomId: integer()
      .notNull()
      .references(() => uomsTable.id, { onDelete: 'restrict' }),

    // Optional instructions for specific item (e.g. "Finely chopped")
    notes: text(),

    // Allows ordering of components if the recipe has steps
    sortOrder: integer().notNull().default(0),

    ...metadata,
  },
  (t) => [
    // A material should only appear once per recipe
    uniqueIndex('recipe_items_recipe_material_idx').on(t.recipeId, t.materialId),
    // Standalone indexes for reverse lookups
    index('recipe_items_material_idx').on(t.materialId),
    index('recipe_items_uom_idx').on(t.uomId),
  ],
)
