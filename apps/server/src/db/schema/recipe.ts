import { sql } from 'drizzle-orm'
import { check, integer, numeric, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core'

import { metadata, pk } from './_helpers'
import { materials, uoms } from './material'
import { productVariants } from './product'

// ─── Recipes ──────────────────────────────────────────────────────────────────
// A recipe defines how to make a target item.
// The target can be EITHER a material (type 'semi') OR a productVariant.
// We enforce that exactly one of (materialId, productVariantId) is not null.

export const recipes = pgTable(
  'recipes',
  {
    ...pk,
    materialId: integer().references(() => materials.id, { onDelete: 'cascade' }),
    productVariantId: integer().references(() => productVariants.id, { onDelete: 'cascade' }),

    // The amount produced by this recipe
    targetQty: numeric({ precision: 18, scale: 4 }).notNull().default('1'),

    // Optional preparation instructions
    instructions: text(),

    ...metadata,
  },
  (t) => [
    // Ensure a material can have at most one recipe
    uniqueIndex('recipes_material_idx')
      .on(t.materialId)
      .where(sql`${t.materialId} IS NOT NULL`),
    // Ensure a product variant can have at most one recipe
    uniqueIndex('recipes_product_variant_idx')
      .on(t.productVariantId)
      .where(sql`${t.productVariantId} IS NOT NULL`),
    // Check constraint: exactly one target must be set
    check('recipe_target_chk', sql`num_nonnulls("materialId", "productVariantId") = 1`),
  ]
)

// ─── Recipe Items ─────────────────────────────────────────────────────────────
// The ingredients/components required for a recipe.

export const recipeItems = pgTable(
  'recipe_items',
  {
    ...pk,
    recipeId: integer()
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    // The component material required
    materialId: integer()
      .notNull()
      .references(() => materials.id, { onDelete: 'restrict' }),

    // Quantity of the material needed
    qty: numeric({ precision: 18, scale: 4 }).notNull(),
    // UOM used for this ingredient in the recipe (should match baseUom or be convertible)
    uomId: integer()
      .notNull()
      .references(() => uoms.id),

    ...metadata,
  },
  (t) => [
    // A material should only appear once per recipe
    uniqueIndex('recipe_items_recipe_material_idx').on(t.recipeId, t.materialId),
  ]
)
